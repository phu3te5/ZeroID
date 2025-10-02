// server/routes/mpc.js
const express = require('express');
const router = express.Router();
const {
  storeSaltShare,
  recoverSaltShares
} = require('../controllers/mpcController');

router.post('/store', storeSaltShare);     // Send salt shares to DB
router.get('/recover/:userId', recoverSaltShares); // Get shares for recovery

module.exports = router;
