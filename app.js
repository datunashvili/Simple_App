'use strict';

const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Health check must never depend on DB
app.get('/health', (req, res) => res.status(200).send('ok'));

let pool = null;

function getPool() {
  if (pool) return pool;

  const { DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT, DB_SSL } = process.env;

  if (!DB_HOST || DB_HOST === 'None' || !DB_USER || !DB_PASS || !DB_NAME) {
    console.warn('DB not configured yet; / will return 503 until DB is ready');
    return null;
  }

  pool = new Pool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    port: Number(DB_PORT) || 5432,
    ssl: DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  // Optional: log when pool connects successfully
  pool.on('connect', () => {
    console.log('Connected to PostgreSQL');
  });

  pool.on('error', (err) => {
    console.error('Unexpected DB error:', err);
    pool = null; // reset pool on error
  });

  return pool;
}

// Root route checks DB
app.get('/', async (req, res) => {
  try {
    const p = getPool();
    if (!p) return res.status(503).json({ status: 'error', message: 'database not ready' });

    const result = await p.query('SELECT NOW() AS now');
    res.json({ status: 'ok', time: result.rows[0].now });
  } catch (err) {
    console.error('DB query failed:', err);
    res.status(503).json({ status: 'error', message: 'database unavailable' });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on 0.0.0.0:${PORT}`);
  console.log(`DB_HOST=${process.env.DB_HOST || 'not set'}`);
});
