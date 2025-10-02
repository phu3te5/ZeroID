import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// 🔐 Fonction pour parser un JWT (payload base64)
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Invalid token', e);
    return null;
  }
}

// 🔐 Fonction pour générer une chaîne hexadécimale aléatoire
function generateRandomDecimalString(bytes = 16) {
  const array = new Uint8Array(bytes);
  window.crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString()).join('');
}

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [proof, setProof] = useState(null);
  const [publicSignals, setPublicSignals] = useState(null);
  const [isVerified, setIsVerified] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    const userString = params.get('user');

    if (tokenParam && userString) {
      setToken(tokenParam);
      setUser(JSON.parse(decodeURIComponent(userString)));
      localStorage.setItem('token', tokenParam);
      localStorage.setItem('user', userString);
    } else {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    }
  }, []);

  const handleZKProof = async () => {
    if (!token) {
      alert('JWT token missing');
      return;
    }

    const payload = parseJwt(token);
    if (!payload) {
      alert('Failed to decode token');
      return;
    }

    const zkPayload = {
  stid: payload.stid || '123456',
  aud: payload.aud || '654321',
  iss: payload.iss || '111111',
  salt: generateRandomDecimalString(16),
  vku: payload.vku || payload.sub || '999999',
  T_exp: payload.exp || '999999',
  r: generateRandomDecimalString(8),
};


    try {
      const res = await axios.post('http://localhost:3001/api/zk/prove', zkPayload);
      setProof(res.data.proof);
      setPublicSignals(res.data.publicSignals);
    } catch (err) {
      alert('ZK Proof error: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleVerify = async () => {
    try {
      const res = await axios.post('http://localhost:3001/api/zk/verify', {
        proof,
        publicSignals,
      });
      setIsVerified(res.data.valid);
    } catch (err) {
      alert('Verification error: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleLoginGoogle = () => {
    window.location.href = 'http://localhost:3001/api/auth/google';
  };
  const handleLoginGithub = () => {
    window.location.href = 'http://localhost:3001/api/auth/github';
  };
  const handleLoginDiscord = () => {
    window.location.href = 'http://localhost:3001/api/auth/discord';
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setProof(null);
    setPublicSignals(null);
    setIsVerified(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <div className="container py-5">
      <h1 className="mb-4">zkLogin Frontend</h1>
      {user ? (
        <div className="card p-4 shadow">
          <h4>Welcome, {user.name}</h4>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Token:</strong> <code>{token}</code></p>

          <button className="btn btn-primary mb-3" onClick={handleZKProof}>
            Generate ZK Proof
          </button>

          {proof && (
            <>
              <h5>ZK Proof</h5>
              <pre className="bg-light p-2 rounded">{JSON.stringify(proof, null, 2)}</pre>
              <h5>Public Signals</h5>
              <pre className="bg-light p-2 rounded">{JSON.stringify(publicSignals, null, 2)}</pre>

              <button className="btn btn-success mt-3" onClick={handleVerify}>
                Verify ZK Proof
              </button>

              {isVerified !== null && (
                <p className="mt-2">
                  Verification result:{' '}
                  {isVerified ? (
                    <span className="text-success">✅ Valid</span>
                  ) : (
                    <span className="text-danger">❌ Invalid</span>
                  )}
                </p>
              )}
            </>
          )}

          <button className="btn btn-outline-secondary mt-4" onClick={handleLogout}>
            Logout
          </button>
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          <button className="btn btn-danger" onClick={handleLoginGoogle}>
            Login with Google
          </button>
          <button className="btn btn-dark" onClick={handleLoginGithub}>
            Login with GitHub
          </button>
          <button className="btn btn-primary" onClick={handleLoginDiscord}>
            Login with Discord
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
