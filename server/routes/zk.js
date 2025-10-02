// In /home/omar/zklogin-mern/server/routes/zk.js

const express = require('express');
const router = express.Router();

// Import the controller functions
const { proveHandler, verifyZKProof } = require('../controllers/zkController');

// Define the route for ZK proof generation
// This will handle POST requests to /api/zk/prove
router.post('/prove', proveHandler);

// Define the route for ZK proof verification
// This will handle POST requests to /api/zk/verify
router.post('/verify', verifyZKProof);

// A simple "ping" route to test if the router is working
router.get('/ping', (req, res) => {
  res.send("ZK Route is alive and well!");
});

// Export the router so it can be used in server.js
module.exports = router;