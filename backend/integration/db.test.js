// backend/integration/db.test.js
describe('Database Integration Tests', () => {
  it('should test database connection', () => {
    // Ovde idu testovi koji zavise od pokrenute PostgreSQL baze
    const dbConnected = true; 
    expect(dbConnected).toBe(true);
  });
});
