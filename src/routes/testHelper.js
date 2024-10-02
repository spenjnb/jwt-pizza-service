const { DB, Role } = require('../database/database.js');

async function createAdminUser() {
  let user = { password: 'toomanysecrets', roles: [{ role: Role.Admin }] };
  user.name = randomName();
  user.email = user.name + '@admin.com';

  await DB.addUser(user);

  user.password = 'toomanysecrets';
  return user;
}

async function createTestUser() {
  let user = { password: 'normalpassword', roles: [{ role: Role.Diner }] };
  user.name = randomName();
  user.email = user.name + '@normal.com';

  await DB.addUser(user);

  user.password = 'normalpassword';
  return user;
}

function randomName() {
  return Math.random().toString(36).substring(2, 12);
}

module.exports = { createAdminUser, createTestUser, randomName };