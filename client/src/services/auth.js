import axios from 'axios';
import { generateSalt, storeSaltSecurely } from '../utils/crypto';
import { generateZKProof } from './zkproof';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const authenticateWithOP = async (provider) => {
  try {
    window.location.href = `${API_URL}/auth/${provider}`;
  } catch (error) {
    console.error('OAuth error:', error);
    throw error;
  }
};

export const handleOAuthCallback = async (code, provider) => {
  try {
    const response = await axios.get(`${API_URL}/auth/${provider}/callback`, {
      params: { code }
    });
    const { jwt, pkOP, iss, aud } = response.data;

    // Generate client-side salt
    const salt = generateSalt();
    await storeSaltSecurely(salt);

    // Generate zkProof
    const zkProof = await generateZKProof(jwt, salt, pkOP, iss, aud);

    // Send proof to server for verification
    const verificationResponse = await axios.post(`${API_URL}/zk/verify`, {
      proof: zkProof.proof,
      publicSignals: zkProof.publicSignals
    });

    return verificationResponse.data;
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await axios.post(`${API_URL}/auth/logout`);
    localStorage.removeItem('zkSalt');
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};