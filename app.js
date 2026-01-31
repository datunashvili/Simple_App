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

  // If DB env vars not present yet, don't crash; just run in "no-db" mode
  const { DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT } = process.env;
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
    // RDS often requires SSL depending on your setup. Enable with DB_SSL=true
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  });

  return pool;
}

app.get('/', async (req, res) => {
  try {
    const p = getPool();
    if (!p) return res.status(503).json({ status: 'error', message: 'database not ready' });

    const r = await p.query('SELECT NOW() AS now');
    res.json({ status: 'ok', time: r.rows[0].now });
  } catch (err) {
    console.error('DB query failed:', err);
    res.status(503).json({ status: 'error', message: 'database unavailable' });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`Running on 0.0.0.0:${PORT}`));
