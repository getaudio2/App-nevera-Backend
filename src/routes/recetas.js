const express = require('express');
const router = express.Router();
const pool = require('../db/index');

router.post('/', async (req, res) => {
    let ingredientes = req.body.ingredientes;

    try {
        // Si no hay ingredientes seleccionados, usar todos los de la nevera
        if (!ingredientes || ingredientes.length === 0) {
            const result = await pool.query(
                'SELECT nombre FROM ingredientes WHERE location = $1',
                ['nevera']
            );
            ingredientes = result.rows.map(row => row.nombre);
        }

        const response = await fetch(
            `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredientes.join(',')}&number=5&ranking=1&ignorePantry=true&apiKey=${process.env.SPOONACULAR_API_KEY}`
        );

        const data = await response.json();

        // Normalizar la respuesta al formato que ya usa el frontend
        const recetas = data.map(receta => ({
            name: receta.title,
            image: receta.image,
            have: receta.usedIngredients.map(i => i.name),
            missing: receta.missedIngredients.map(i => i.name),
        }));

        res.json(recetas);
    } catch (error) {
        console.error('Error al obtener recetas:', error);
        res.status(500).json({ error: 'Error al obtener recetas' });
    }
});

module.exports = router;