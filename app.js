const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = 3000;

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: 5432
});

app.get('/', async (req, res) => {
  const r = await pool.query('SELECT NOW()');
  res.json({ status: 'ok', time: r.rows[0] });
});

app.listen(port, () => console.log('Running'));
