const express = require('express');
const router = express.Router();
const { calculateScore } = require('../controllers/scoreController');

router.get('/score/:did', calculateScore);

module.exports = router;