const testHelper = require("./testHelper");
const request = require("supertest");
const app = require("../service");

describe.skip("orderRouter", () => {
  let adminUser;
  let adminAuthToken;
  let normalUser;

  beforeAll(async () => {
    adminUser = await testHelper.createAdminUser();
    const adminLoginRes = await request(app)
      .put("/api/auth")
      .send({ email: adminUser.email, password: adminUser.password });
    expect(adminLoginRes.status).toBe(200);
    adminAuthToken = adminLoginRes.body.token;
    adminUser.id = adminLoginRes.body.user.id;

    normalUser = await testHelper.createTestUser();
    const normalLoginRes = await request(app)
      .put("/api/auth")
      .send({ email: normalUser.email, password: normalUser.password });
    expect(normalLoginRes.status).toBe(200);
    normalUser.token = normalLoginRes.body.token;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  test("add menu success", async () => {
    const _title = "Mr " + testHelper.randomName();
    const descriptions = [
      "Veggie",
      "Cheese",
      "Pepperoni",
      "Sausage",
      "Supreme",
    ];
    const _price = parseFloat((Math.random() * 100).toFixed(2));
    const _description =
      descriptions[Math.floor(Math.random() * descriptions.length)];
    const _image = "pizza9.png";

    const menuData = {
      title: _title,
      description: _description,
      image: _image,
      price: _price,
    };

    const res = await request(app)
      .put("/api/order/menu")
      .send(menuData)
      .set("Authorization", `Bearer ${adminAuthToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: menuData.title,
          description: menuData.description,
          image: menuData.image,
          price: menuData.price,
        }),
      ])
    );
  });

  test("add menu fail", async () => {
    const _title = "Mr " + testHelper.randomName();
    const descriptions = [
      "Veggie",
      "Cheese",
      "Pepperoni",
      "Sausage",
      "Supreme",
    ];
    const _price = parseFloat((Math.random() * 100).toFixed(2));
    const _description =
      descriptions[Math.floor(Math.random() * descriptions.length)];
    const _image = "pizza9.png";

    const menuData = {
      title: _title,
      description: _description,
      image: _image,
      price: _price,
    };

    const res = await request(app)
      .put("/api/order/menu")
      .send(menuData)
      .set("Authorization", `Bearer ${normalUser.token}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("unable to add menu item");
  });
});
