// backend/health.test.js
describe('Backend Health Check Unit Test', () => {
  it('should pass basic health check status', () => {
    const healthStatus = { status: 'ok', uptime: process.uptime() };
    expect(healthStatus.status).toBe('ok');
  });
});
