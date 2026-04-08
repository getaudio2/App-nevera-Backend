const express = require('express');

const pool = require('./db/index');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/ping', (req, res) => {
    res.json({ message: 'pong' });
});

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});

async function checkDB() {
    try {
        const response = await pool.query('SELECT NOW()');
        console.log('Conectado a la base de datos:', response.rows[0]);
    } catch (error) {
        console.error('Error conectando a la base de datos:', error);
    }
}

checkDB();

app.use('/nevera', require('./routes/nevera'));