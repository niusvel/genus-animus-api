const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/state', gameController.getState);
router.post('/mutate', gameController.mutate);
router.post('/checkpoint', gameController.checkpoint);
router.post('/inventory', gameController.inventory);
router.get('/checkpoints', gameController.getCheckpoints);
router.post('/checkpoints/load', gameController.loadCheckpoint);

module.exports = router;
