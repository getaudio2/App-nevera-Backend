const admin = require('firebase-admin');
//const pool = require('../db/index');

// Inicializar solo una vez, al arrancar el módulo
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

async function mandarNotificacion(titulo, cuerpo) {
    try {
        await admin.messaging().send({
            topic: 'nevera-updates',
            notification: {
                title: titulo,
                body: cuerpo,
            },
        });
    } catch (error) {
        console.error('Error al mandar notificación:', error);
    }
}

module.exports = { mandarNotificacion };