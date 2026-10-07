import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'test_db'
});

describe('Database Integration Tests', () => {
  afterAll(async () => {
    await pool.end();
  });

  it('should successfully connect to PostgreSQL and execute a query', async () => {
    const res = await pool.query('SELECT 1 + 1 AS result');
    expect(res.rows[0].result).toBe(2);
  });
});
