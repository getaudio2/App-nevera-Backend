const express = require('express');
const router = express.Router();
const admin = require('firebase-admin'); // ya inicializado en notificaciones.js

router.post('/', async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token requerido' });
    try {
        await admin.messaging().subscribeToTopic(token, 'nevera-updates');
        res.status(201).json({ ok: true });
    } catch (error) {
        console.error('Error al suscribir al topic:', error);
        res.status(500).json({ error: 'Error al suscribir' });
    }
});

module.exports = router;