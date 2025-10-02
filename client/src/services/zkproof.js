import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const generateZKProof = async (jwt, salt, pkOP, iss, aud) => {
  try {
    const res = await axios.post(`${API_URL}/zk/prove`, {
      jwt,
      salt,
      pkOP,
      iss,
      aud
    });
    return res.data;
  } catch (error) {
    console.error('ZK Proof generation error:', error);
    throw error;
  }
};

export const verifyZKProof = async (proof, publicSignals) => {
  try {
    const res = await axios.post(`${API_URL}/zk/verify`, {
      proof,
      publicSignals
    });
    return res.data;
  } catch (error) {
    console.error('ZK Proof verification error:', error);
    throw error;
  }
};
