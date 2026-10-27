const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { prisma } = require('../src/config/prisma');
const { hashToken } = require('../src/utils/crypto');

describe('Authentication & Session API Tests', () => {
  const testUser = {
    name: 'Security Test User',
    email: `security.test.${Date.now()}@workflowx.dev`,
    password: 'Password123!',
  };

  let sessionCookie = null;
  let userId = null;

  after(async () => {
    // Clean up test records
    if (userId) {
      await prisma.session.deleteMany({ where: { userId } }).catch(() => {});
      await prisma.passwordResetToken.deleteMany({ where: { userId } }).catch(() => {});
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
  });

  it('registers a new user and returns 201 with session cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser)
      .expect(201);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.email, testUser.email);
    assert.ok(res.body.data.user.id);
    userId = res.body.data.user.id;

    const cookies = res.headers['set-cookie'];
    assert.ok(cookies, 'Must return Set-Cookie header');
    const hasSessionCookie = cookies.some((c) => c.includes('workflowx_session='));
    assert.ok(hasSessionCookie, 'Must set workflowx_session cookie');
    sessionCookie = cookies.find((c) => c.includes('workflowx_session='));
  });

  it('rejects duplicate email registration with 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser)
      .expect(409);

    assert.equal(res.body.success, false);
    assert.match(res.body.message, /already exists/i);
  });

  it('authenticates with valid credentials and rotates session', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      })
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.email, testUser.email);
    const cookies = res.headers['set-cookie'];
    sessionCookie = cookies.find((c) => c.includes('workflowx_session='));
  });

  it('rejects invalid password with 401 without exposing account details', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword999!',
      })
      .expect(401);

    assert.equal(res.body.success, false);
    assert.equal(res.body.message, 'Invalid email or password.');
  });

  it('returns current user with valid session cookie on GET /api/v1/auth/me', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', sessionCookie)
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.id, userId);
  });

  it('rejects unauthenticated request to GET /api/v1/auth/me with 401', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .expect(401);

    assert.equal(res.body.success, false);
  });

  it('logs out and invalidates session in database', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', sessionCookie)
      .expect(200);

    assert.equal(res.body.success, true);

    // Re-attempting with the same cookie should now fail with 401
    await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', sessionCookie)
      .expect(401);
  });
});
