const express = require('express');
const mysql = require('mysql2');
const fs = require('node:fs');
const path = require('node:path');

require('dotenv').config();

const app = express();

app.use(express.json());

const caValue = process.env.DB_SSL_CA;
const caContent = caValue && caValue.includes('-----BEGIN CERTIFICATE-----')
  ? caValue.replace(/\\n/g, '\n')
  : caValue && fs.existsSync(caValue)
    ? fs.readFileSync(caValue, 'utf8')
    : undefined;
const ssl = process.env.DB_SSL === 'true'
  ? {
      rejectUnauthorized: true,
      ...(caContent ? { ca: caContent } : {})
    }
  : undefined;

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'defaultdb',
  port: Number(process.env.DB_PORT || 3306),
  ssl,
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true,
  dateStrings: true
});

app.use('/api', (req, res, next) => {
  if (!process.env.VERCEL) return next();

  const missing = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']
    .filter((key) => !process.env[key]);

  const sslEnabled = process.env.DB_SSL === 'true';
  if (sslEnabled && !caContent) missing.push('DB_SSL_CA (certificado PEM)');

  if (!missing.length) return next();
  const message = `Configuración incompleta en Vercel: ${missing.join(', ')}`;
  console.error(message);
  return res.status(503).json({ ok: false, error: message });
});

const handleDbError = (res, error, message) => {
  console.error(`${message}:`, error.message);
  res.status(500).json({ ok: false, error: message });
};

const validate = (values, fields) => fields.every((field) =>
  values[field] !== undefined && values[field] !== null && values[field] !== ''
);

const listTable = (table, order = 'id ASC') => (req, res) => {
  pool.query(`SELECT * FROM ${table} ORDER BY ${order}`, (error, results) => {
    if (error) return handleDbError(res, error, `No se pudieron consultar ${table}`);
    res.json(results);
  });
};

app.get('/api/estudiantes', listTable('estudiantes'));
app.post('/api/estudiantes', (req, res) => {
  const { nombre, grupo } = req.body;
  if (!validate(req.body, ['nombre', 'grupo'])) {
    return res.status(400).json({ ok: false, error: 'Nombre y grupo son obligatorios' });
  }
  pool.query('INSERT INTO estudiantes (nombre, grupo) VALUES (?, ?)', [nombre.trim(), grupo.trim()], (error, result) => {
    if (error) return handleDbError(res, error, 'No se pudo crear el estudiante');
    res.status(201).json({ id: result.insertId, nombre: nombre.trim(), grupo: grupo.trim() });
  });
});
app.put('/api/estudiantes/:id', (req, res) => {
  const { nombre, grupo } = req.body;
  if (!validate(req.body, ['nombre', 'grupo'])) {
    return res.status(400).json({ ok: false, error: 'Nombre y grupo son obligatorios' });
  }
  pool.query('UPDATE estudiantes SET nombre = ?, grupo = ? WHERE id = ?', [nombre.trim(), grupo.trim(), req.params.id], (error, result) => {
    if (error) return handleDbError(res, error, 'No se pudo actualizar el estudiante');
    if (!result.affectedRows) return res.status(404).json({ ok: false, error: 'Estudiante no encontrado' });
    res.json({ ok: true });
  });
});
app.delete('/api/estudiantes/:id', (req, res) => {
  pool.query('DELETE FROM estudiantes WHERE id = ?', [req.params.id], (error, result) => {
    if (error) return handleDbError(res, error, 'No se pudo eliminar el estudiante');
    if (!result.affectedRows) return res.status(404).json({ ok: false, error: 'Estudiante no encontrado' });
    res.json({ ok: true });
  });
});

app.get('/api/productos', listTable('productos'));
app.post('/api/productos', (req, res) => {
  const { nombre, precio } = req.body;
  if (!validate(req.body, ['nombre', 'precio']) || !Number.isFinite(Number(precio)) || Number(precio) < 0) {
    return res.status(400).json({ ok: false, error: 'Nombre y precio válido son obligatorios' });
  }
  pool.query('INSERT INTO productos (nombre, precio) VALUES (?, ?)', [nombre.trim(), Number(precio)], (error, result) => {
    if (error) return handleDbError(res, error, 'No se pudo crear el producto');
    res.status(201).json({ id: result.insertId, nombre: nombre.trim(), precio: Number(precio) });
  });
});
app.put('/api/productos/:id', (req, res) => {
  const { nombre, precio } = req.body;
  if (!validate(req.body, ['nombre', 'precio']) || !Number.isFinite(Number(precio)) || Number(precio) < 0) {
    return res.status(400).json({ ok: false, error: 'Nombre y precio válido son obligatorios' });
  }
  pool.query('UPDATE productos SET nombre = ?, precio = ? WHERE id = ?', [nombre.trim(), Number(precio), req.params.id], (error, result) => {
    if (error) return handleDbError(res, error, 'No se pudo actualizar el producto');
    if (!result.affectedRows) return res.status(404).json({ ok: false, error: 'Producto no encontrado' });
    res.json({ ok: true });
  });
});
app.delete('/api/productos/:id', (req, res) => {
  pool.query('DELETE FROM productos WHERE id = ?', [req.params.id], (error, result) => {
    if (error) return handleDbError(res, error, 'No se pudo eliminar el producto');
    if (!result.affectedRows) return res.status(404).json({ ok: false, error: 'Producto no encontrado' });
    res.json({ ok: true });
  });
});

app.get('/api/ventas', (req, res) => {
  const sql = `
    SELECT v.id, v.estudiante_id, v.producto_id, v.cantidad, v.fecha,
           e.nombre AS estudiante, e.grupo, p.nombre AS producto, p.precio,
           (v.cantidad * p.precio) AS total
    FROM ventas v
    INNER JOIN estudiantes e ON e.id = v.estudiante_id
    INNER JOIN productos p ON p.id = v.producto_id
    ORDER BY v.fecha DESC, v.id DESC
  `;
  pool.query(sql, (error, results) => {
    if (error) return handleDbError(res, error, 'No se pudieron consultar las ventas');
    res.json(results);
  });
});
app.post('/api/ventas', (req, res) => {
  const { estudiante_id, producto_id, cantidad, fecha } = req.body;
  if (!validate(req.body, ['estudiante_id', 'producto_id', 'cantidad', 'fecha']) || !Number.isInteger(Number(cantidad)) || Number(cantidad) < 1) {
    return res.status(400).json({ ok: false, error: 'Estudiante, producto, cantidad y fecha son obligatorios' });
  }
  pool.query(
    'INSERT INTO ventas (estudiante_id, producto_id, cantidad, fecha) VALUES (?, ?, ?, ?)',
    [estudiante_id, producto_id, Number(cantidad), fecha],
    (error, result) => {
      if (error) return handleDbError(res, error, 'No se pudo registrar la venta');
      res.status(201).json({ id: result.insertId });
    }
  );
});
app.delete('/api/ventas/:id', (req, res) => {
  pool.query('DELETE FROM ventas WHERE id = ?', [req.params.id], (error, result) => {
    if (error) return handleDbError(res, error, 'No se pudo eliminar la venta');
    if (!result.affectedRows) return res.status(404).json({ ok: false, error: 'Venta no encontrada' });
    res.json({ ok: true });
  });
});

app.use('/api', (req, res) => res.status(404).json({ ok: false, error: 'Ruta API no encontrada' }));
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

module.exports = app;