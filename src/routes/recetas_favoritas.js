const express = require('express');
const router = express.Router();
const pool = require('../db/index');

// Obtener todas las favoritas
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM recetas_favoritas ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener favoritas:', error);
        res.status(500).json({ error: 'Error al obtener favoritas' });
    }
});

// Añadir favorita
router.post('/', async (req, res) => {
    const { name, image, have, missing, steps, time } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO recetas_favoritas (name, image, have, missing, steps, time) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, image, have, missing, steps, time]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al guardar favorita:', error);
        res.status(500).json({ error: 'Error al guardar favorita' });
    }
});

// Eliminar favorita
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM recetas_favoritas WHERE id = $1', [id]);
        res.json({ ok: true });
    } catch (error) {
        console.error('Error al eliminar favorita:', error);
        res.status(500).json({ error: 'Error al eliminar favorita' });
    }
});

module.exports = router;