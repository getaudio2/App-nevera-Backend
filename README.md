# 🧊 Mi Nevera — Backend


## ¿Qué es Mi Nevera?

**Mi Nevera** es una aplicación para gestionar el inventario de la nevera, la lista de la compra y obtener sugerencias de recetas por IA. Este repositorio contiene el backend: una API REST con Node.js + Express, base de datos PostgreSQL y un servidor WebSocket para sincronización en tiempo real entre dispositivos.

---

## Stack técnico

| Tecnología | Uso |
|---|---|
| **Node.js + Express** | Servidor y API REST |
| **PostgreSQL** | Base de datos relacional |
| **ws** | Servidor WebSocket |
| **Groq API** | Generación de sugerencias de recetas por IA |
| **Railway** | Despliegue del servidor y la base de datos |

---

## Funcionalidades

### API REST
- CRUD completo de ingredientes de nevera (`/api/nevera`)
- CRUD completo de lista de la compra (`/api/compra`)
- Endpoint de sugerencias de recetas por IA (`/api/recetas`)
- Mover ingredientes entre nevera y lista de la compra

### WebSocket en tiempo real
- Broadcast automático a todos los clientes conectados tras cada operación de escritura
- Eventos: `nevera:add`, `nevera:update`, `nevera:delete`, `compra:add`, `compra:update`, `compra:delete`
- Reconexión gestionada en el cliente; el servidor acepta nuevas conexiones en cualquier momento
- Whitelist de orígenes configurable via variable de entorno + soporte para Capacitor Android (`https://localhost`)

---

## Arquitectura

```
src/
├── routes/
│   ├── nevera.js        # Endpoints de la nevera
│   ├── compra.js        # Endpoints de la lista de la compra
│   └── recetas.js       # Endpoint de sugerencias por IA
├── websocket/
│   └── index.js         # Servidor WebSocket: init() y broadcast()
├── db/
│   └── index.js         # Conexión a PostgreSQL
└── index.js             # Entry point: Express + WebSocket adjunto al servidor HTTP
```

El módulo WebSocket se inicializa adjunto al servidor HTTP de Express con `init(server)`, y expone `broadcast(evento, datos)` para emitir cambios en tiempo real desde cualquier ruta.

---

## Base de datos

### Esquema principal

```sql
CREATE TABLE ingredientes (
  id        SERIAL PRIMARY KEY,
  nombre    TEXT NOT NULL,
  cantidad  TEXT,
  caduca    DATE,
  emoji     TEXT DEFAULT '🥄',
  categoria TEXT DEFAULT 'otros',
  ubicacion TEXT NOT NULL CHECK (ubicacion IN ('nevera', 'compra')),
  comprado  BOOLEAN DEFAULT FALSE
);
```

---

## Variables de entorno

Crea un fichero `.env` en la raíz del proyecto:

```env
DATABASE_URL=postgresql://usuario:contraseña@host:puerto/nombre_db
CORS_ORIGIN=https://tu-dominio.com
GROQ_API_KEY=tu_clave_de_groq
PORT=3000
```

`CORS_ORIGIN` acepta múltiples orígenes separados por comas. El origen `https://localhost` (Capacitor Android) siempre está permitido.

---

## Instalación y desarrollo

```bash
npm install
npm run dev
```

### Producción

```bash
npm start
```

---

## Despliegue en Railway

1. Conecta este repositorio en [railway.app](https://railway.app)
2. Añade un plugin de PostgreSQL al proyecto
3. Configura las variables de entorno (`GROQ_API_KEY`, `CORS_ORIGIN`)
4. Railway inyecta `DATABASE_URL` automáticamente al añadir la base de datos

---

## Repo del frontend

👉 [mi-nevera-frontend](https://github.com/getaudio2/App-nevera-Frontend)
