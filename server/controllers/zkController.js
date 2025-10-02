// In /home/omar/zklogin-mern/server/controllers/zkController.js

const { proveZKLogin, verifyProof } = require('../utils/zk');

// --- PROVE HANDLER ---
const proveHandler = async (req, res) => {
  // Debug log to see what the server receives
  console.log('--- Received request at /api/zk/prove ---');
  console.log('Request Body:', req.body);

  try {
    const { stid, aud, iss, salt, vku, T_exp, r } = req.body;

    // Debug log to see variables after deconstruction
    console.log('Deconstructed Variables:', { stid, aud, iss, salt, vku, T_exp, r });

    const { proof, publicSignals } = await proveZKLogin(stid, aud, iss, salt, vku, T_exp, r);
    res.json({ proof, publicSignals });

  } catch (err) {
    console.error("ZK proof generation failed:", err);
    res.status(500).json({ error: err.message });
  }
};

// --- VERIFY HANDLER ---
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


// ✨ THE FIX: Export the handler functions so other files can import them.
module.exports = {
  proveHandler,
  verifyZKProof
};