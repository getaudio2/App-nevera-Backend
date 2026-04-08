const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./db/index');

const app = express();
const PORT = process.env.PORT || 3000;

const http = require('http');
const server = http.createServer(app);

const ws = require('./websocket/index');
ws.init(server);

app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
}));
app.use(express.json());

server.listen(PORT, () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});

app.get('/ping', (req, res) => {
    res.json({ message: 'pong' });
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
app.use('/compra', require('./routes/compra'));
app.use('/recetas', require('./routes/recetas'));