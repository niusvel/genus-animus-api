const db = require('../db/client');

const findByEmail = async (email) => {
  const query = 'SELECT * FROM users WHERE email = ? LIMIT 1;';
  const result = await db.execute({
    sql: query,
    args: [email.toLowerCase().trim()],
  });
  return result.rows[0] || null;
};

const findById = async (id) => {
  const query = 'SELECT * FROM users WHERE id = ? LIMIT 1;';
  const result = await db.execute({
    sql: query,
    args: [id],
  });
  return result.rows[0] || null;
};

const createUser = async (id, email, hashedPassword) => {
  const query = 'INSERT INTO users (id, email, password) VALUES (?, ?, ?);';
  await db.execute({
    sql: query,
    args: [id, email.toLowerCase().trim(), hashedPassword],
  });
  return { id, email };
};

module.exports = {
  findByEmail,
  findById,
  createUser,
};
