const express = require('express');
const router = express.Router();
const pool = require('../db/index');

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
    const { nombre, cantidad, fecha_caducidad } = req.body; // Leemos los datos del cuerpo de la solicitud
    try {
        const result = await pool.query(
            'INSERT INTO ingredientes (nombre, cantidad, fecha_caducidad, location) VALUES ($1, $2, $3, $4) RETURNING *',
            [nombre, cantidad, fecha_caducidad, 'nevera']
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al agregar ingrediente:', error);
        res.status(500).json({ error: 'Error al agregar ingrediente' });
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, cantidad, fecha_caducidad } = req.body;
    try {
        const result = await pool.query(
            'UPDATE ingredientes SET nombre = $1, cantidad = $2, fecha_caducidad = $3 WHERE id = $4 AND location = $5 RETURNING *',
            [nombre, cantidad, fecha_caducidad, id, 'nevera']
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ingrediente no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al actualizar ingrediente:', error);
        res.status(500).json({ error: 'Error al actualizar ingrediente' });
    }
});

router.post('/:id/mover-compra', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'UPDATE ingredientes SET location = $1 WHERE id = $2 AND location = $3 RETURNING *',
            ['compra', id, 'nevera']
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ingrediente no encontrado' });
        }
        res.json(result.rows[0]);
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
    } catch (error) {
        console.error('Error al eliminar ingrediente:', error);
        res.status(500).json({ error: 'Error al eliminar ingrediente' });
    }
});

module.exports = router;