CREATE TABLE ingredientes (
  id        SERIAL PRIMARY KEY,
  nombre    TEXT NOT NULL,
  cantidad  TEXT,
  caduca    DATE,
  location  TEXT NOT NULL CHECK (location IN ('nevera', 'compra')),
  comprado  BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);