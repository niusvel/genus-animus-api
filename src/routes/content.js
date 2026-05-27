const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/escena/:id', contentController.getScene);

module.exports = router;
