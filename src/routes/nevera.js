const express = require('express');
const router = express.Router();
const pool = require('../db/index');
const { broadcast } = require('../websocket/index');
const { mandarNotificacion } = require('../utils/notificaciones');

router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM ingredientes WHERE location = $1', ['nevera']);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener ingredientes:', error);
        res.status(500).json({ error: 'Error al obtener ingredientes' });
    }
});  

router.post('/', async (req, res) => {
    const { nombre, caduca, emoji, categoria, nombre_en } = req.body; // Leemos los datos del cuerpo de la solicitud
    try {
        const result = await pool.query(
            'INSERT INTO ingredientes (nombre, caduca, location, emoji, categoria, nombre_en) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [nombre, caduca, 'nevera', emoji, categoria, nombre_en]
        );
        res.status(201).json(result.rows[0]);
        broadcast('nevera:create', result.rows[0]); // Notificamos a los clientes conectados
    } catch (error) {
        console.error('Error al agregar ingrediente:', error);
        res.status(500).json({ error: 'Error al agregar ingrediente' });
    }
});

router.post('/confirmar-ticket', async (req, res) => {
    const { ingredientes } = req.body;
    if (!Array.isArray(ingredientes) || ingredientes.length === 0) {
        return res.status(400).json({ error: 'Lista de ingredientes vacía' });
    }
    try {
        const insertados = [];
        for (const item of ingredientes) {
            const result = await pool.query(
                'INSERT INTO ingredientes (nombre, caduca, location, emoji, categoria, nombre_en) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [item.nombre, item.caduca, 'nevera', item.emoji, item.categoria, item.nombre_en]
            );
            const nuevo = result.rows[0];
            insertados.push(nuevo);
            broadcast('nevera:create', nuevo);

            // Elimina de la lista de compra cualquier pendiente con el mismo nombre
            const eliminados = await pool.query(
                'DELETE FROM ingredientes WHERE nombre = $1 AND location = $2 RETURNING id',
                [item.nombre, 'compra']
            );
            eliminados.rows.forEach(row => broadcast('compra:delete', { id: row.id }));
        }
        res.status(201).json(insertados);
        await mandarNotificacion(
            '🧾 Compra registrada',
            'Se ha hecho la compra, revisa la nevera'
        );
    } catch (error) {
        console.error('Error al confirmar ticket:', error);
        res.status(500).json({ error: 'Error al confirmar ticket' });
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
        const { nombre, caduca, emoji, categoria, nombre_en } = req.body;
    try {
        const result = await pool.query(
            'UPDATE ingredientes SET nombre = $1, caduca = $2, emoji = $3, categoria = $4, nombre_en = $5 WHERE id = $6 AND location = $7 RETURNING *',
            [nombre, caduca, emoji, categoria, nombre_en, id, 'nevera']
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ingrediente no encontrado' });
        }
        res.json(result.rows[0]);
        broadcast('nevera:update', result.rows[0]); // Notificamos a los clientes conectados
    } catch (error) {
        console.error('Error al actualizar ingrediente:', error);
        res.status(500).json({ error: 'Error al actualizar ingrediente' });
    }
});

router.post('/:id/mover-compra', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'UPDATE ingredientes SET location = $1,comprado = false WHERE id = $2 AND location = $3 RETURNING *',
            ['compra', id, 'nevera']
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ingrediente no encontrado' });
        }
        res.json(result.rows[0]);
        broadcast('nevera:move', result.rows[0]); // Notificamos a los clientes conectados
        await mandarNotificacion( // Push notification para informar que un ingrediente se ha movido a la lista de compra
            '🛒 Nevera actualizada',
            `${result.rows[0].nombre} se ha acabado`
        );
    } catch (error) {
        console.error('Error al mover ingrediente a compra:', error);
        res.status(500).json({ error: 'Error al mover ingrediente a compra' });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM ingredientes WHERE id = $1 AND location = $2', [id, 'nevera']);
        res.status(204).send();
        broadcast('nevera:delete', { id: parseInt(id) }); // Notificamos a los clientes conectados
    } catch (error) {
        console.error('Error al eliminar ingrediente:', error);
        res.status(500).json({ error: 'Error al eliminar ingrediente' });
    }
});

module.exports = router;