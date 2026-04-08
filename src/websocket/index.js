const { WebSocketServer } = require('ws');

const clients = new Set();

function init(server) {
    const wss = new WebSocketServer({ server });

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