const express = require('express');
const router = express.Router();
const pool = require('../db/index');

router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM ingredientes WHERE location = $1', ['nevera']);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching ingredientes:', error);
        res.status(500).json({ error: 'Error fetching ingredientes' });
    }
});

router.post('/', async (req, res) => {
    const { name, quantity, unit } = req.body; // Leemos los datos del cuerpo de la solicitud
    try {
        const result = await pool.query(
            'INSERT INTO ingredientes (name, quantity, unit, location) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, quantity, unit, 'nevera']
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding ingrediente:', error);
        res.status(500).json({ error: 'Error adding ingrediente' });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM ingredientes WHERE id = $1 AND location = $2', [id, 'nevera']);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting ingrediente:', error);
        res.status(500).json({ error: 'Error deleting ingrediente' });
    }
});

module.exports = router;