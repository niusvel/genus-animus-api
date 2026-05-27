const app = require('./app');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`   GENUS ANIMUS SERVER IS RUNNING ON PORT ${PORT}`);
  console.log(`   ENVIRONMENT: ${process.env.NODE_ENV || 'development'}`);
  console.log(`==================================================`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
