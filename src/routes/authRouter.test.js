const testHelper = require('./testHelper');
const request = require('supertest');
const app = require('../service');

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
let testUserAuthToken;

describe('authRouter', () => {
  beforeAll(async () => {
    testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
    const registerRes = await request(app).post('/api/auth').send(testUser);
    testUserAuthToken = registerRes.body.token;
    testUser.id = registerRes.body.user.id;
  });
  
  test('login success', async () => {
    const loginRes = await request(app).put('/api/auth').send(testUser);
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
    expect(testUserAuthToken).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
  
    const { password, ...user } = { ...testUser, roles: [{ role: 'diner' }] };
    expect(loginRes.body.user).toMatchObject(user);
    expect(password).toBe('a');
  });

  test('login fail', async () => {
    const wrongUser = { name: 'wrong', email: 'wrong@noemail.com', password: 'wrong' };
    const loginRes = await request(app).put('/api/auth').send(wrongUser);
    expect(loginRes.status).toBe(404);
    expect(loginRes.body.message).toBe('unknown user');
  });

  test('updateUser success for regular user updating own data', async () => {
    const newEmail = Math.random().toString(36).substring(2, 12) + '@test.com';
    const newPassword = 'newpassword';
  
    const updateRes = await request(app)
      .put(`/api/auth/${testUser.id}`)
      .send({ email: newEmail, password: newPassword })
      .set('Authorization', `Bearer ${testUserAuthToken}`);
  
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.email).toBe(newEmail);
  });
  

  test('updateAdmin success', async () => {
    const adminUser = await testHelper.createAdminUser();
    const adminLoginRes = await request(app).put('/api/auth').send({ email: adminUser.email, password: adminUser.password });
    expect(adminLoginRes.status).toBe(200);
    const adminAuthToken = adminLoginRes.body.token;
    adminUser.id = adminLoginRes.body.user.id;

    const newEmail = Math.random().toString(36).substring(2, 12) + '@test.com';
    const newPassword = 'b';

    const updateRes = await request(app)
      .put(`/api/auth/${adminUser.id}`)
      .send({ email: newEmail, password: newPassword })
      .set('Authorization', `Bearer ${adminAuthToken}`);

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.email).toBe(newEmail);
  });

  test('updateUser fail', async () => {
    const newEmail = Math.random().toString(36).substring(2, 12) + '@test.com';
    const newPassword = 'newpassword';
    const wrongUserId = testUser.id + 1;

    const updateRes = await request(app)
      .put(`/api/auth/${wrongUserId}`)
      .send({ email: newEmail, password: newPassword })
      .set('Authorization', `Bearer ${testUserAuthToken}`);

    expect(updateRes.status).toBe(403);
    expect(updateRes.body.message).toBe('unauthorized');
  });

  test('logout success', async () => {
    const logoutRes = await request(app).delete('/api/auth').set('Authorization', `Bearer ${testUserAuthToken}`);
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.message).toBe('logout successful');
  });

  test('logout fail', async () => {
    const invalidToken = '${testUserAuthToken}invalid';
    const logoutRes = await request(app).delete('/api/auth').set('Authorization', `Bearer ${invalidToken}`);
    expect(logoutRes.status).toBe(401);
    expect(logoutRes.body.message).toBe('unauthorized');
  });

  test('register wrong credential', async () => {
    emptyUser = { name: '', email: '', password: '' };
    const registerRes = await request(app).post('/api/auth').send(emptyUser);
    expect(registerRes.status).toBe(400);
    expect(registerRes.body.message).toBe('name, email, and password are required');
  });
});