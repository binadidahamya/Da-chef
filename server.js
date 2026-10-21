const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY;

const db = new Database(path.join(__dirname, 'reservations.db'));
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    guests INTEGER NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'public')));

function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

app.post('/api/reservations', (req, res) => {
  const name = cleanText(req.body.name, 100);
  const phone = cleanText(req.body.phone, 30);
  const date = cleanText(req.body.date, 10);
  const time = cleanText(req.body.time, 5);
  const notes = cleanText(req.body.notes, 500);
  const guests = Number(req.body.guests);

  if (!name || !phone || !date || !time) {
    return res.status(400).json({ error: 'Please complete all required fields.' });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return res.status(400).json({ error: 'Please enter a valid date and time.' });
  }
  const requestedDate = new Date(`${date}T${time}:00`);
  if (Number.isNaN(requestedDate.getTime())) {
    return res.status(400).json({ error: 'Invalid date or time.' });
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateOnly = new Date(`${date}T00:00:00`);
  if (dateOnly < today) return res.status(400).json({ error: 'Please choose today or a future date.' });
  if (!Number.isInteger(guests) || guests < 1 || guests > 10) {
    return res.status(400).json({ error: 'Guest count must be between 1 and 10.' });
  }

  const insert = db.prepare(`
    INSERT INTO reservations (name, phone, date, time, guests, notes)
    VALUES (@name, @phone, @date, @time, @guests, @notes)
  `);
  const result = insert.run({ name, phone, date, time, guests, notes });
  res.status(201).json({
    message: 'Reservation request received.',
    reservationId: result.lastInsertRowid
  });
});

// Simple protected admin endpoint. Set ADMIN_KEY in your environment before use.
app.get('/api/admin/reservations', (req, res) => {
  if (!ADMIN_KEY) {
    return res.status(503).json({ error: 'Admin endpoint is not configured. Set ADMIN_KEY first.' });
  }
  if (req.get('x-admin-key') !== ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  const rows = db.prepare('SELECT * FROM reservations ORDER BY created_at DESC, id DESC').all();
  res.json(rows);
});

app.patch('/api/admin/reservations/:id', (req, res) => {
  if (!ADMIN_KEY) return res.status(503).json({ error: 'Admin endpoint is not configured.' });
  if (req.get('x-admin-key') !== ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized.' });

  const allowed = new Set(['pending', 'confirmed', 'cancelled', 'completed']);
  const status = cleanText(req.body.status, 20);
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1 || !allowed.has(status)) {
    return res.status(400).json({ error: 'Provide a valid reservation ID and status.' });
  }
  const result = db.prepare('UPDATE reservations SET status = ? WHERE id = ?').run(status, id);
  if (!result.changes) return res.status(404).json({ error: 'Reservation not found.' });
  res.json({ message: 'Reservation status updated.' });
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Da Chef website running at http://localhost:${PORT}`);
});
