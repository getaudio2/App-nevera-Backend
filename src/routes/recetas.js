const express = require('express');
const router = express.Router();
const pool = require('../db/index');

const CATALOGO = [
  { nombre: 'Pollo', en: 'chicken' },
  { nombre: 'Ternera', en: 'beef' },
  { nombre: 'Cerdo', en: 'pork' },
  { nombre: 'Salmón', en: 'salmon' },
  { nombre: 'Atún', en: 'tuna' },
  { nombre: 'Tomate', en: 'tomato' },
  { nombre: 'Lechuga', en: 'lettuce' },
  { nombre: 'Cebolla', en: 'onion' },
  { nombre: 'Ajo', en: 'garlic' },
  { nombre: 'Zanahoria', en: 'carrot' },
  { nombre: 'Pimiento', en: 'bell pepper' },
  { nombre: 'Brócoli', en: 'broccoli' },
  { nombre: 'Espinacas', en: 'spinach' },
  { nombre: 'Patata', en: 'potato' },
  { nombre: 'Manzana', en: 'apple' },
  { nombre: 'Plátano', en: 'banana' },
  { nombre: 'Naranja', en: 'orange' },
  { nombre: 'Limón', en: 'lemon' },
  { nombre: 'Fresas', en: 'strawberries' },
  { nombre: 'Leche', en: 'milk' },
  { nombre: 'Queso', en: 'cheese' },
  { nombre: 'Yogur', en: 'yogurt' },
  { nombre: 'Mantequilla', en: 'butter' },
  { nombre: 'Huevos', en: 'eggs' },
  { nombre: 'Arroz', en: 'rice' },
  { nombre: 'Pasta', en: 'pasta' },
  { nombre: 'Lentejas', en: 'lentils' },
  { nombre: 'Garbanzos', en: 'chickpeas' },
  { nombre: 'Pan', en: 'bread' },
  { nombre: 'Aceite', en: 'olive oil' },
];

function mapearACatalogo(nombreEN) {
    const lower = nombreEN.toLowerCase();
    const encontrado = CATALOGO.find(item =>
        lower.includes(item.en.toLowerCase()) ||
        item.en.toLowerCase().includes(lower)
    );
    return encontrado ? encontrado.nombre : null;
}

const mapearOTraducir = async (nombreEN) => {
    const delCatalogo = mapearACatalogo(nombreEN);
    if (delCatalogo) return delCatalogo; // match directo, sin DeepL
    return await traducir(nombreEN); // no está en catálogo, traducir
};

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
        if (!searchData || searchData.length === 0) {
            return res.json([]);
        }
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

        // 4. Preparar para traducir
        const recetasES = await Promise.all(recetas.map(async (r) => ({
            ...r,
            name: await traducir(r.name),
            have: await Promise.all(r.have.map(i => mapearOTraducir(i))),
            missing: await Promise.all(r.missing.map(i => mapearOTraducir(i))),
            //steps: await Promise.all(r.steps.map(s => traducir(s))), // Los steps se quedan en inglés por ahora, ya que la traducción puede ser muy larga y Spoonacular no devuelve pasos en español
        })));

        res.json(recetasES);
    } catch (error) {
        console.error('Error al obtener recetas:', error);
        res.status(500).json({ error: 'Error al obtener recetas' });
    }
});

// Función helper para traducir texto
async function traducir(texto) {
    if (!texto || texto.trim() === '') return texto;
    try {
        const res = await fetch('https://api-free.deepl.com/v2/translate', {
            method: 'POST',
            headers: {
                'Authorization': `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: [texto],
                source_lang: 'EN',
                target_lang: 'ES',
            })
        });
        const data = await res.json();
        return data.translations[0].text;
    } catch (e) {
        console.error('Error traduciendo:', texto, e.message);
        return texto; // devuelve el texto original si es que falla la traducción por problema del parseo con Spoonacular
    }
}

module.exports = router;