const express = require('express');
const router = express.Router();
const pool = require('../db/index');
const { broadcast } = require('../websocket');
const { mandarNotificacion } = require('../utils/notificaciones');

router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM ingredientes WHERE location = $1', ['compra']);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener ingredientes:', error);
        res.status(500).json({ error: 'Error al obtener ingredientes' });
    }
});

router.post('/', async (req, res) => {
    const { nombre, cantidad, caduca } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO ingredientes (nombre, cantidad, caduca, location) VALUES ($1, $2, $3, $4) RETURNING *',
            [nombre, cantidad, caduca, 'compra']
        );
        res.status(201).json(result.rows[0]);
        broadcast('compra:create', result.rows[0]); // Notificamos a los clientes conectados
    } catch (error) {
        console.error('Error al agregar ingrediente:', error);
        res.status(500).json({ error: 'Error al agregar ingrediente' });
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, cantidad, caduca, comprado } = req.body;
    try {
        const result = await pool.query(
            'UPDATE ingredientes SET nombre = COALESCE($1, nombre), cantidad = COALESCE($2, cantidad), caduca = COALESCE($3, caduca), comprado = COALESCE($4, comprado) WHERE id = $5 AND location = $6 RETURNING *',
            [nombre, cantidad, caduca, comprado, id, 'compra']
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ingrediente no encontrado' });
        }
        res.json(result.rows[0]);
        broadcast('compra:update', result.rows[0]); // Notificamos a los clientes conectados
    } catch (error) {
        console.error('Error al actualizar ingrediente:', error);
        res.status(500).json({ error: 'Error al actualizar ingrediente' });
    }
});

router.post('/:id/mover-nevera', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'UPDATE ingredientes SET location = $1,comprado = false WHERE id = $2 AND location = $3 RETURNING *',
            ['nevera', id, 'compra']
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ingrediente no encontrado' });
        }
        res.json(result.rows[0]);
        broadcast('compra:move', result.rows[0]);
        await mandarNotificacion(
            '🥚 Nevera actualizada',
            `${result.rows[0].nombre} se ha comprado`
        );
    } catch (error) {
        console.error('Error al mover ingrediente a nevera:', error);
        res.status(500).json({ error: 'Error al mover ingrediente a nevera' });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM ingredientes WHERE id = $1 AND location = $2', [id, 'compra']);
        res.status(204).send();
        broadcast('compra:delete', { id: parseInt(id) }); // Notificamos a los clientes conectados
    } catch (error) {
        console.error('Error al eliminar ingrediente:', error);
        res.status(500).json({ error: 'Error al eliminar ingrediente' });
    }
});

module.exports = router;