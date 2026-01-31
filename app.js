// server.js
'use strict';

const express = require('express');
const { Pool } = require('pg');

const app = express();

// ECS/containers: prefer env port, default 3000
const PORT = Number(process.env.PORT) || 3000;

// Postgres pool (fails fast if required env vars are missing)
const required = ['DB_HOST', 'DB_USER', 'DB_PASS', 'DB_NAME'];
for (const k of required) {
  if (!process.env[k]) {
    console.error(`Missing required env var: ${k}`);
  }
}

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 5432,
  // Optional: set DB_SSL=true if your DB requires TLS (e.g., RDS with SSL)
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  // Optional: reasonable defaults
  max: Number(process.env.DB_POOL_MAX) || 10,
  idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS) || 30000,
  connectionTimeoutMillis: Number(process.env.DB_CONN_TIMEOUT_MS) || 5000
});

// ALB health check endpoint (must NOT depend on DB)
app.get('/health', (req, res) => {
  res.status(200).send('ok');
});

// Main route (DB-backed) with error handling so the container doesn't crash
app.get('/', async (req, res) => {
  try {
    const r = await pool.query('SELECT NOW() AS now');
    res.json({ status: 'ok', time: r.rows[0].now });
  } catch (err) {
    console.error('DB query failed:', err);
    res.status(500).json({ status: 'error', message: 'database unavailable' });
  }
});

// Graceful shutdown (ECS will SIGTERM on stop)
async function shutdown(signal) {
  try {
    console.log(`${signal} received, closing server and DB pool...`);
    await pool.end();
  } catch (e) {
    console.error('Error during shutdown:', e);
  } finally {
    process.exit(0);
  }
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// IMPORTANT for containers: bind to 0.0.0.0 so ALB can reach it
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Running on http://0.0.0.0:${PORT}`);
});
