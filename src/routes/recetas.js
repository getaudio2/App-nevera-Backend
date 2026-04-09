const express = require('express');
const router = express.Router();
const pool = require('../db/index');

async function getGroqResponse(ingredientes) {

    if (!ingredientes || ingredientes.length === 0) {
        const result = await pool.query(
            'SELECT nombre FROM ingredientes WHERE location = $1', 
            ['nevera']
        );
        ingredientes = result.rows.map(row => row.nombre);
    }

    const prompt = `Tengo estos ingredientes en la nevera: ${ingredientes.join(', ')}.

    Sugiere EXACTAMENTE 5 recetas variadas. Para cada receta responde SOLO con un array JSON con este formato exacto:
    [
    {
        "name": "Nombre de la receta",
        "time": "X minutos",
        "difficulty": "Fácil/Media/Difícil",
        "description": "Una línea describiendo el plato",
        "ingredients": ["ing1", "ing2"],
        "have": ["ingredientes que el usuario SÍ tiene"],
        "missing": ["ingredientes que NO tiene el usuario"],
        "steps": ["paso 1", "paso 2", "paso 3"]
    }
    ]

    Incluye 2-3 recetas que se puedan hacer SOLO con los ingredientes disponibles, y 2-3 que necesiten 1-3 ingredientes extra comunes. Responde SOLO con el JSON array, sin texto adicional, sin backticks.`;


    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [{ role: 'user', content: prompt }]
        })
    });

    const data = await response.json();
    const text = data.choices[0].message.content;
    const recipes = JSON.parse(text);
    
    // Recalcular have y missing con los ingredientes reales
    const recetasCorregidas = recipes.map(receta => {
        const have = receta.ingredients.filter(ing =>
            ingredientes.some(i => i.toLowerCase() === ing.toLowerCase())
        );
        const missing = receta.ingredients.filter(ing =>
            !ingredientes.some(i => i.toLowerCase() === ing.toLowerCase())
        );
        return { ...receta, have, missing };
    });

    return recetasCorregidas;
}

router.post('/', async (req, res) => {
    let ingredientes = req.body.ingredientes;
    try {
        const recetas = await getGroqResponse(ingredientes);
        res.json(recetas);
    } catch (error) {
        console.error('Error al obtener recetas:', error);
        res.status(500).json({ error: 'Error al obtener recetas' });
    }
});

module.exports = router;