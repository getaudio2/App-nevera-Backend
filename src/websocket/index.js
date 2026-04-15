const { WebSocketServer } = require('ws');

const clients = new Set();

function init(server) {
    const wss = new WebSocketServer({ 
        server,
        verifyClient: (info) => {
            const origin = info.origin;
            
            // Los clientes nativos (el Capacitor con Android por ej) no envían origen
            if (!origin || origin === 'null') return true;
            
            const allowed = (process.env.CORS_ORIGIN || 'http://localhost:5173')
                .split(',') // Para añadir múltiples orígenes separados por comas
                .map(o => o.trim());
            
            return allowed.includes(origin);
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