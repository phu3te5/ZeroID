// server/utils/zk.js
const snarkjs = require('snarkjs');
const fs = require('fs');
const path = require('path');

function toBigIntSafe(value) {
  if (!/^\d+$/.test(value)) {
    console.error("❌ Invalid ZK input (not numeric):", value);
    throw new Error(`Invalid input: ${value} is not a numeric string`);
  }
  return BigInt(value).toString();
}


exports.proveZKLogin = async (stid, aud, iss, salt, vku, T_exp, r) => {
  const input = {
    stid: toBigIntSafe(stid),
    aud: toBigIntSafe(aud),
    iss: toBigIntSafe(iss),
    salt: toBigIntSafe(salt),
    vku: toBigIntSafe(vku),
    T_exp: toBigIntSafe(T_exp),
    r: toBigIntSafe(r)
  };

  const wasmPath = path.join(__dirname, '../circuits/zklogin_js/zklogin.wasm');
  const zkeyPath = path.join(__dirname, '../circuits/zklogin_final.zkey');

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    wasmPath,
    zkeyPath
  );

  return { proof, publicSignals };
};

exports.verifyProof = async (proof, publicSignals) => {
  const vKeyPath = path.join(__dirname, '../circuits/verification_key.json');
  const vKey = JSON.parse(fs.readFileSync(vKeyPath));
  return await snarkjs.groth16.verify(vKey, publicSignals, proof);
};

exports.proveHandler = async (req, res) => {
  try {
    const { stid, aud, iss, salt, vku, T_exp, r } = req.body;
    const { proof, publicSignals } = await exports.proveZKLogin(stid, aud, iss, salt, vku, T_exp, r);
    res.json({ proof, publicSignals });
  } catch (err) {
    console.error("ZK proof generation failed:", err);
    res.status(500).json({ error: err.message });
  }
};

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
