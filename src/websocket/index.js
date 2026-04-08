const { WebSocketServer } = require('ws');

const clients = new Set();

function init(server) {
    const wss = new WebSocketServer({ 
        server,
        verifyClient: (info) => {
            const origin = info.origin;
            const allowed = process.env.CORS_ORIGIN || 'http://localhost:5173';
            return origin === allowed;
        }
    });

    wss.on('connection', (ws) => {
        clients.add(ws);
        console.log('Nuevo cliente conectado');

        ws.on('close', () => {
            clients.delete(ws);
            console.log('Cliente desconectado');
        });
    });
}

function broadcast(evento, datos) {
    clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
            client.send(JSON.stringify({ evento, datos }));
        }
    });
}

module.exports = { init, broadcast };