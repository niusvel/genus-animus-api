const errorHandler = (err, req, res, next) => {
  console.error('Unhandled error:', err.stack || err);
  
  const status = err.status || 500;
  const message = err.message || 'internal_server_error';

  return res.status(status).json({
    error: message,
  });
};

module.exports = errorHandler;
