import express from 'express';
import pg from 'pg';
import amqp from 'amqplib';

const { Pool } = pg;

// Konfiguracija iz env varijabli
const PORT = process.env.PORT || 3000;
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const DB_NAME = process.env.DB_NAME || 'tododb';
const AMQP_URL = process.env.AMQP_URL || 'amqp://localhost';

// Ispis konfiguracije bez lozinke pri startu
console.log('--- STARTING BACKEND ---');
console.log(`Port: ${PORT}`);
console.log(`Database Config: Host=${DB_HOST}, Port=${DB_PORT}, User=${DB_USER}, DBName=${DB_NAME}`);
console.log(`RabbitMQ URL: ${AMQP_URL}`);

const pool = new Pool({
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
});

// RabbitMQ inicijalizacija
let amqpChannel = null;

async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(AMQP_URL);
    amqpChannel = await connection.createChannel();
    await amqpChannel.assertQueue('todo.completed', { durable: true });
    console.log('Connected to RabbitMQ and ensured "todo.completed" queue exists');
  } catch (err) {
    console.error('Failed to connect to RabbitMQ, retrying in 5 seconds...', err.message);
    setTimeout(connectRabbitMQ, 5000);
  }
}

connectRabbitMQ();

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

app.get('/api/activity', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM activity_log ORDER BY id DESC LIMIT 50'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching activity log:', err);
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

    const wasDoneBefore = current.rows[0].done;
    const updatedDone = done !== undefined ? done : current.rows[0].done;
    const updatedTitle = title !== undefined ? title : current.rows[0].title;

    const result = await pool.query(
      'UPDATE todos SET done = $1, title = $2 WHERE id = $3 RETURNING *',
      [updatedDone, updatedTitle, id]
    );

    const updatedTodo = result.rows[0];

    // Provera: Slanje poruke u RabbitMQ ako je todo označen kao završen (PATCH sa done=true)
    if (done === true && !wasDoneBefore && amqpChannel) {
      const message = {
        todoId: updatedTodo.id,
        title: updatedTodo.title,
        completedAt: new Date().toISOString(),
      };

      amqpChannel.sendToQueue(
        'todo.completed',
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );
      console.log('Published message to "todo.completed":', message);
    }

    res.json(updatedTodo);
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