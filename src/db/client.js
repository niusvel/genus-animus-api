const { createClient } = require('@libsql/client');
require('dotenv').config();

const url = process.env.DATABASE_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN;

if (!url) {
  console.error('DATABASE_URL is not defined in the environment variables.');
  process.exit(1);
}

const db = createClient({
  url,
  authToken,
});

module.exports = db;
