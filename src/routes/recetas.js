const express = require('express');
const router = express.Router();
const pool = require('../db/index');

router.post('/', async (req, res) => {
    let ingredientes = req.body.ingredientes;

    try {
        // Si no hay ingredientes seleccionados, usar todos los de la nevera
        if (!ingredientes || ingredientes.length === 0) {
            const result = await pool.query(
                'SELECT nombre_en FROM ingredientes WHERE location = $1',
                ['nevera']
            );
            ingredientes = result.rows.map(row => row.nombre_en);
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

        const nombresTraducidos = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [{ role: 'user', content: `Traduce al español estos textos de recetas de cocina y devuelve SOLO un JSON array con los mismos objetos pero traducidos, sin backticks ni texto extra: ${JSON.stringify(recetas)}` }]
            })
        });
        const traduccion = await nombresTraducidos.json();
        const recetasES = JSON.parse(traduccion.choices[0].message.content);
        res.json(recetasES);
    } catch (error) {
        console.error('Error al obtener recetas:', error);
        res.status(500).json({ error: 'Error al obtener recetas' });
    }
});

module.exports = router;