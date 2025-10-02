import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const regenerateSalt = async (userId, token) => {
  try {
    const res = await axios.post(
      `${API_URL}/mpc/regenerate-salt`,
      { userId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  } catch (error) {
    console.error('Regenerate salt error:', error);
    throw error;
  }
};