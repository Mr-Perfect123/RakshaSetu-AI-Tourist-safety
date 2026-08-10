const request = require('supertest');
const app = require('../src/app');

describe('RakshaSetu Auth API Suite', () => {
  it('GET /api/v1/health - should return UP status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('UP');
  });

  it('POST /api/v1/auth/login - should authenticate admin successfully', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@rakshasetu.gov.in',
      password: 'Password@123'
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toHaveProperty('accessToken');
  });
});
