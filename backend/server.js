import express from 'express';
import pg from 'pg';

const { Pool } = pg;

// Konfiguracija iz env varijabli
const PORT = process.env.PORT || 3000;
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const DB_NAME = process.env.DB_NAME || 'tododb';

// Ispis konfiguracije bez lozinke pri startu
console.log('--- STARTING BACKEND ---');
console.log(`Port: ${PORT}`);
console.log(`Database Config: Host=${DB_HOST}, Port=${DB_PORT}, User=${DB_USER}, DBName=${DB_NAME}`);

const pool = new Pool({
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
});

const app = express();
app.use(express.json());

// Logovanje svakog zahteva
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// GET /api/todos - dohvati sve todos
app.get('/api/todos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM todos ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching todos:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/todos - dodaj novi todo
app.post('/api/todos', async (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO todos (title) VALUES ($1) RETURNING *',
      [title]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding todo:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.patch('/api/todos/:id', async (req, res) => {
  const { id } = req.params;
  const { done, title } = req.body;
  try {
    const current = await pool.query('SELECT * FROM todos WHERE id = $1', [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const updatedDone = done !== undefined ? done : current.rows[0].done;
    const updatedTitle = title !== undefined ? title : current.rows[0].title;

    const result = await pool.query(
      'UPDATE todos SET done = $1, title = $2 WHERE id = $3 RETURNING *',
      [updatedDone, updatedTitle, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating todo:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/todos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM todos WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    res.json({ message: 'Todo deleted', id });
  } catch (err) {
    console.error('Error deleting todo:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});