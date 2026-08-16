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

        // 1. Buscar recetas por ingredientes
        const searchRes = await fetch(
            `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredientes.join(',')}&number=5&ranking=1&ignorePantry=true&apiKey=${process.env.SPOONACULAR_API_KEY}`
        );
        const searchData = await searchRes.json();
        const ids = searchData.map(r => r.id).join(',');

        // 2. Obtener info detallada de todas las recetas en una sola llamada
        const infoRes = await fetch(
            `https://api.spoonacular.com/recipes/informationBulk?ids=${ids}&apiKey=${process.env.SPOONACULAR_API_KEY}`
        );
        const infoData = await infoRes.json();

        // 3. Combinar los datos
        const recetas = searchData.map(receta => {
            const info = infoData.find(i => i.id === receta.id);
            return {
                name: receta.title,
                image: receta.image,
                have: receta.usedIngredients.map(i => i.name),
                missing: receta.missedIngredients.map(i => i.name),
                time: info?.readyInMinutes ? `${info.readyInMinutes} min` : null,
                steps: info?.analyzedInstructions?.[0]?.steps?.map(s => s.step) || [],
            };
        });

        res.json(recetas);
    } catch (error) {
        console.error('Error al obtener recetas:', error);
        res.status(500).json({ error: 'Error al obtener recetas' });
    }
});

module.exports = router;