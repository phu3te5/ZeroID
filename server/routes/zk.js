// /home/omar/zklogin-mern/server/routes/zk.js

const express = require('express');
const router = express.Router();

// Only keep verification — no proof generation on server
const { verifyZKProof } = require('../controllers/zkController');

// ❌ REMOVE: router.post('/prove', proveHandler);

// ✅ KEEP: Verify proofs sent from client
router.post('/verify', verifyZKProof);

// Ping route (optional)
router.get('/ping', (req, res) => {
  res.send("ZK Route is alive and well!");
});

module.exports = router;