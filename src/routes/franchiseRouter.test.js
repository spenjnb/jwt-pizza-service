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
        expect(res.body).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: 7,
                    name: 'Pizza Palace' }),
                ]),
                expect.objectContaining({
                    id: 12, 
                    name: '0s0d8fvy3f'
                }),
                expect.objectContaining({
                    id: 25, 
                    name: 'pizza am7lx91y76'
                }),            
        );
    });

    test('getUserFranchises success', async () => {
        const res = await request(app)
            .get(`/api/franchise/${adminUser.id}`)
            .set('Authorization', `Bearer ${adminAuthToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toBeInstanceOf(Array);
    });
});