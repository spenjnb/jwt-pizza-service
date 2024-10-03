const testHelper = require('./testHelper');
const request = require('supertest');
const app = require('../service');

describe('franchiseRouter', () => {
    let adminUser;
    let adminAuthToken;
    let normalUser;

    beforeAll(async () => {
        adminUser = await testHelper.createAdminUser();
        const adminLoginRes = await request(app)
            .put('/api/auth')
            .send({ email: adminUser.email, password: adminUser.password });
        expect(adminLoginRes.status).toBe(200);
        adminAuthToken = adminLoginRes.body.token;
        adminUser.id = adminLoginRes.body.user.id;

        normalUser = await testHelper.createTestUser();
        const normalLoginRes = await request(app)
            .put('/api/auth')
            .send({ email: normalUser.email, password: normalUser.password });
        expect(normalLoginRes.status).toBe(200);
        normalUser.token = normalLoginRes.body.token;
    });

    test('createFranchise success', async () => {
        const franchiseData = {
            name: 'pizza ' + testHelper.randomName(),
            admins: [{ email: adminUser.email }],
          };
      
          const res = await request(app)
            .post('/api/franchise')
            .send(franchiseData)
            .set('Authorization', `Bearer ${adminAuthToken}`);
      
          expect(res.status).toBe(200);
          expect(res.body.name).toBe(franchiseData.name);
          expect(res.body.admins).toEqual(
            expect.arrayContaining([
              expect.objectContaining({ email: adminUser.email }),
            ])
          );
    });

    test('createFranchise fail', async () => {
        const franchiseData = {
            name: testHelper.randomName(),
            admins: [{ email: normalUser.email }],
          };
      
          const res = await request(app)
            .post('/api/franchise')
            .send(franchiseData)
            .set('Authorization', `Bearer ${normalUser.token}`);
      
          expect(res.status).toBe(403);
          expect(res.body.message).toBe('unable to create a franchise');
    });

    test('getFranchises success', async () => {
        const res = await request(app)
            .get('/api/franchise');
        expect(res.status).toBe(200);
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body.length).toBeGreaterThan(0);
    });

    test('getUserFranchises success', async () => {
        const res = await request(app)
            .get(`/api/franchise/${adminUser.id}`)
            .set('Authorization', `Bearer ${adminAuthToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body.length).toBeGreaterThan(0);
    });

    test('getUserFranchises fail', async () => {
        const res = await request(app)
            .get(`/api/franchise/${normalUser.id}`)
            .set('Authorization', `Bearer ${normalUser.token}`);
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    test('deleteFranchise success', async () => {
        const franchiseData = {
            name: 'pizza ' + testHelper.randomName(),
            admins: [{ email: adminUser.email }],
          };
      
          const franchise = await request(app)
            .post('/api/franchise')
            .send(franchiseData)
            .set('Authorization', `Bearer ${adminAuthToken}`);
      
          const res = await request(app)
            .delete(`/api/franchise/${franchise.body.id}`)
            .set('Authorization', `Bearer ${adminAuthToken}`);
      
          expect(res.status).toBe(200);
          expect(res.body.message).toBe('franchise deleted');
    });

    test('deleteFranchise fail', async () => {
        const franchiseData = {
            name: 'pizza ' + testHelper.randomName(),
            admins: [{ email: adminUser.email }],
          };
      
          const franchise = await request(app)
            .post('/api/franchise')
            .send(franchiseData)
            .set('Authorization', `Bearer ${adminAuthToken}`);
      
          const res = await request(app)
            .delete(`/api/franchise/${franchise.body.id}`)
            .set('Authorization', `Bearer ${normalUser.token}`);
      
          expect(res.status).toBe(403);
          expect(res.body.message).toBe('unable to delete a franchise');
    });

    test('createStore success', async () => {
        const franchiseData = {
            name: 'pizza ' + testHelper.randomName(),
            admins: [{ email: adminUser.email }],
          };
      
          const franchise = await request(app)
            .post('/api/franchise')
            .send(franchiseData)
            .set('Authorization', `Bearer ${adminAuthToken}`);
      
          const storeData = {
            name: 'store ' + testHelper.randomName(),
            franchiseId: franchise.body.id,
          };
      
          const res = await request(app)
            .post(`/api/franchise/${franchise.body.id}/store`)
            .send(storeData)
            .set('Authorization', `Bearer ${adminAuthToken}`);
      
          expect(res.status).toBe(200);
          expect(res.body.name).toBe(storeData.name);
          expect(res.body.franchiseId).toBe(franchise.body.id);
    });

    test('createStore fail', async () => {
        const franchiseData = {
            name: 'pizza ' + testHelper.randomName(),
            admins: [{ email: adminUser.email }],
          };
      
          const franchise = await request(app)
            .post('/api/franchise')
            .send(franchiseData)
            .set('Authorization', `Bearer ${adminAuthToken}`);
      
          const storeData = {
            name: 'store ' + testHelper.randomName(),
            franchiseId: franchise.body.id,
          };
      
          const res = await request(app)
            .post(`/api/franchise/${franchise.body.id}/store`)
            .send(storeData)
            .set('Authorization', `Bearer ${normalUser.token}`);
      
          expect(res.status).toBe(403);
          expect(res.body.message).toBe('unable to create a store');
    });

    test('deleteStore success', async () => {
        const franchiseData = {
            name: 'pizza ' + testHelper.randomName(),
            admins: [{ email: adminUser.email }],
          };
      
          const franchise = await request(app)
            .post('/api/franchise')
            .send(franchiseData)
            .set('Authorization', `Bearer ${adminAuthToken}`);
      
          const storeData = {
            name: 'store ' + testHelper.randomName(),
            franchiseId: franchise.body.id,
          };
      
          const store = await request(app)
            .post(`/api/franchise/${franchise.body.id}/store`)
            .send(storeData)
            .set('Authorization', `Bearer ${adminAuthToken}`);
      
          const res = await request(app)
            .delete(`/api/franchise/${franchise.body.id}/store/${store.body.id}`)
            .set('Authorization', `Bearer ${adminAuthToken}`);
      
          expect(res.status).toBe(200);
          expect(res.body.message).toBe('store deleted');
    });

    test('deleteStore fail', async () => {
        const franchiseData = {
            name: 'pizza ' + testHelper.randomName(),
            admins: [{ email: adminUser.email }],
          };
      
          const franchise = await request(app)
            .post('/api/franchise')
            .send(franchiseData)
            .set('Authorization', `Bearer ${adminAuthToken}`);
      
          const storeData = {
            name: 'store ' + testHelper.randomName(),
            franchiseId: franchise.body.id,
          };
      
          const store = await request(app)
            .post(`/api/franchise/${franchise.body.id}/store`)
            .send(storeData)
            .set('Authorization', `Bearer ${adminAuthToken}`);
      
          const res = await request(app)
            .delete(`/api/franchise/${franchise.body.id}/store/${store.body.id}`)
            .set('Authorization', `Bearer ${normalUser.token}`);
      
          expect(res.status).toBe(403);
          expect(res.body.message).toBe('unable to delete a store');
    });
});