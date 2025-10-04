// /home/omar/zklogin-mern/server/controllers/zkController.js

const { verifyProof } = require('../utils/zk');

// ❌ REMOVE proveHandler — proof is generated in browser

// ✅ KEEP ONLY verification
const verifyZKProof = async (req, res) => {
  try {
    const { proof, publicSignals } = req.body;
    const isValid = await verifyProof(proof, publicSignals);
    res.json({ valid: isValid });
  } catch (err) {
    console.error("ZK proof verification failed:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  // proveHandler, ← REMOVED
  verifyZKProof
};