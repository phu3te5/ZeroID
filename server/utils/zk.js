// server/utils/zk.js

const snarkjs = require('snarkjs');
const fs = require('fs');
const path = require('path');

// ✅ ONLY keep verification — no proving on server
exports.verifyProof = async (proof, publicSignals) => {
  // Use a dedicated 'keys' folder (not circuits/)
  const vKeyPath = path.join(__dirname, '../keys/verification_key.json');
  const vKey = JSON.parse(fs.readFileSync(vKeyPath, 'utf8'));
  return await snarkjs.groth16.verify(vKey, publicSignals, proof);
};

// ✅ Keep verify handler for /api/zk/verify
exports.verifyZKProof = async (req, res) => {
  try {
    const { proof, publicSignals } = req.body;
    const isValid = await exports.verifyProof(proof, publicSignals);
    res.json({ valid: isValid });
  } catch (err) {
    console.error("ZK proof verification failed:", err);
    res.status(500).json({ error: err.message });
  }
};