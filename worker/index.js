import os from 'os';
import amqp from 'amqplib';
import pg from 'pg';

const { Pool } = pg;

// Konfiguracija iz okruženja (environment varijable)
const AMQP_URL = process.env.AMQP_URL || 'amqp://localhost';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const DB_NAME = process.env.DB_NAME || 'tododb';

const WORKER_DELAY_MS = Number(process.env.WORKER_DELAY_MS) || 3000;
const WORKER_AUTO_ACK = process.env.WORKER_AUTO_ACK === 'true';

const HOSTNAME = os.hostname();

console.log('--- STARTING WORKER ---');
console.log(`Hostname: ${HOSTNAME}`);
console.log(`Config: AMQP=${AMQP_URL}, DB=${DB_HOST}:${DB_PORT}/${DB_NAME}`);
console.log(`Delay: ${WORKER_DELAY_MS}ms, Auto-ACK: ${WORKER_AUTO_ACK}`);

const pool = new Pool({
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
});

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function startWorker() {
  try {
    const connection = await amqp.connect(AMQP_URL);
    const channel = await connection.createChannel();
    
    await channel.assertQueue('todo.completed', { durable: true });
    // Kanal prima po jednu poruku pre slanja ack-a (prefetch=1)
    channel.prefetch(1);

    console.log('Worker listening on "todo.completed" queue...');

    channel.consume('todo.completed', async (msg) => {
      if (!msg) return;

      const content = JSON.parse(msg.content.toString());
      console.log(`[${HOSTNAME}] Received message:`, content);

      // Ako je auto-ack uključen, šalji ack odmah po prijemu
      if (WORKER_AUTO_ACK) {
        channel.ack(msg);
        console.log(`[${HOSTNAME}] Auto-ACK sent immediately`);
      }

      // Čekanje zadatog kašnjenja
      await sleep(WORKER_DELAY_MS);

      try {
        // Upis reda u tabelu activity_log
        await pool.query(
          `INSERT INTO activity_log (todo_id, processed_by, processed_at) 
           VALUES ($1, $2, NOW())`,
          [content.todoId, HOSTNAME]
        );
        console.log(`[${HOSTNAME}] Saved activity log for todoId: ${content.todoId}`);

        // Ako nije auto-ack, šalji ack tek posle uspešnog upisa u bazu
        if (!WORKER_AUTO_ACK) {
          channel.ack(msg);
          console.log(`[${HOSTNAME}] Manual ACK sent after DB insert`);
        }
      } catch (err) {
        console.error(`[${HOSTNAME}] Error processing message:`, err);
        if (!WORKER_AUTO_ACK) {
          // Vraćanje poruke u red radi ponovnog pokušaja
          channel.nack(msg, false, true);
        }
      }
    });
  } catch (err) {
    console.error('Failed to connect to RabbitMQ, retrying in 5 seconds...', err.message);
    setTimeout(startWorker, 5000);
  }
}

startWorker();