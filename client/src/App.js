// client/src/App.js
import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { groth16 } from 'snarkjs';

function splitNumericSalt(salt, sharesCount = 5, threshold = 3) {
  const num = BigInt(salt);
  const parts = [];
  const coeffs = [];
  for (let i = 1; i < threshold; i++) {
    coeffs.push(BigInt(Math.floor(Math.random() * 1000000)));
  }
  for (let x = 1; x <= sharesCount; x++) {
    let y = num;
    for (let i = 1; i < threshold; i++) {
      y += coeffs[i - 1] * BigInt(x) ** BigInt(i);
    }
    parts.push(y.toString());
  }
  return parts.map((share, i) => ({ part: i + 1, share }));
}

function combineNumericShares(shares) {
  const points = shares.slice(0, 3).map(s => [BigInt(s.part), BigInt(s.share)]);
  const [x1, y1] = points[0];
  const [x2, y2] = points[1];
  const [x3, y3] = points[2];

  const denom1 = (x1 - x2) * (x1 - x3);
  const denom2 = (x2 - x1) * (x2 - x3);
  const denom3 = (x3 - x1) * (x3 - x2);

  const term1 = y1 * x2 * x3 / denom1;
  const term2 = y2 * x1 * x3 / denom2;
  const term3 = y3 * x1 * x2 / denom3;

  const secret = term1 + term2 + term3;
  return secret.toString();
}

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Invalid token', e);
    return null;
  }
}

function generateNumericSalt(len = 16) {
  const array = new Uint8Array(len);
  window.crypto.getRandomValues(array);
  return Array.from(array, b => (b % 10).toString()).join('');
}

function generateRandomDecimalString(bytes = 8) {
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
  const [loading, setLoading] = useState(false);

  const backupSaltToMPC = async (userId, salt) => {
    try {
      const shares = splitNumericSalt(salt, 5, 3);
      const shareObjects = shares.map((s, i) => ({
        part: i + 1,
        share: s.share
      }));

      const response = await fetch('http://localhost:3001/api/mpc/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, shares: shareObjects })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      console.log('Salt backup successful');
    } catch (err) {
      console.error('MPC backup failed:', err);
      alert('⚠️ Salt backup failed...');
    }
  };

  const recoverSaltFromMPC = async (userId) => {
    try {
      console.log('Attempting to recover salt for userId:', userId);
      const res = await fetch(`http://localhost:3001/api/mpc/recover/${userId}`);
      const data = await res.json();
      console.log('Server returned:', data);

      if (!data.shares || data.shares.length < 3) {
        console.warn('Not enough shares to recover salt:', data.shares?.length);
        return null;
      }

      const recovered = combineNumericShares(data.shares);
      console.log('Recovered salt:', recovered);
      return recovered;
    } catch (err) {
      console.error('MPC recovery failed:', err);
      return null;
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    const userString = params.get('user');

    const initAuth = async () => {
      if (tokenParam && userString) {
        const user = JSON.parse(decodeURIComponent(userString));
        let salt = localStorage.getItem('zkSalt');

        if (!salt) {
          salt = await recoverSaltFromMPC(user._id);
        }

        if (!salt) {
          salt = generateNumericSalt(16);
          localStorage.setItem('zkSalt', salt);
          await backupSaltToMPC(user._id, salt);
        }

        setUser({ ...user, salt });
        setToken(tokenParam);
        localStorage.setItem('token', tokenParam);
        localStorage.setItem('user', userString);
      }
    };

    initAuth();
  }, []);

  const handleZKProof = async () => {
    if (!token || !user?.salt) {
      alert('Missing token or salt');
      return;
    }

    const payload = parseJwt(token);
    if (!payload) {
      alert('Invalid JWT');
      return;
    }

    if (!/^\d+$/.test(user.salt)) {
      alert('Salt must be numeric!');
      return;
    }

    const inputs = {
      sub: (payload.sub || '123456').replace(/\D/g, '') || '123456',
      aud: '654321',
      iss: '111111',
      salt: user.salt,
      vku: '999999',
      T_exp: payload.exp ? String(payload.exp) : '999999',
      r: generateRandomDecimalString(8),
    };

    setLoading(true);
    try {
      const { proof, publicSignals } = await groth16.fullProve(
        inputs,
        '/circuits/zklogin.wasm',
        '/circuits/zklogin_final.zkey'
      );
      setProof(proof);
      setPublicSignals(publicSignals);
    } catch (err) {
      console.error('ZK Proof failed:', err);
      alert('ZK Proof failed: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!proof || !publicSignals) {
      alert('No proof to verify');
      return;
    }

    try {
      const res = await fetch('http://localhost:3001/api/zk/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proof, publicSignals }),
      });
      const data = await res.json();
      setIsVerified(data.valid);
    } catch (err) {
      console.error('Verification error:', err);
      alert('Verification failed: ' + (err.message || 'Network error'));
    }
  };

  const handleRecoverSalt = async () => {
    if (!user?._id) {
      alert('User not logged in');
      return;
    }
    const salt = await recoverSaltFromMPC(user._id);
    if (salt && /^\d+$/.test(salt)) {
      localStorage.setItem('zkSalt', salt);
      setUser(prev => ({ ...prev, salt }));
      alert('✅ Salt recovered!');
    } else {
      alert('❌ Recovery failed or invalid salt');
    }
  };

  const handleLoginGoogle = () => {
    window.location.href = 'http://localhost:3001/api/auth/google?prompt=select_account';
  };

  const handleLoginGithub = () => {
    window.location.href = 'http://localhost:3001/api/auth/github'; // no fake prompt
  };

  const handleLoginDiscord = () => {
    window.location.href = 'http://localhost:3001/api/auth/discord'; // no fake prompt
  };

 // This is the NEW, improved function for client/src/App.js

const handleLogout = () => {
  // First, figure out which provider the user logged in with.
  // We get this from the 'user' object before we delete it.
  const provider = user?.provider;

  // 1. Delete all of the application's data from state and local storage.
  setUser(null);
  setToken(null);
  setProof(null);
  setPublicSignals(null);
  setIsVerified(null);
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('zkSalt');

  // 2. Redirect the user to the correct provider to complete the logout.
  // This is the key to restarting the login mechanism for a new user.
  if (provider === 'github') {
    // Redirect to GitHub's homepage. The user can sign out from the top-right menu.
    window.location.href = 'https://github.com';
  } else if (provider === 'discord') {
    // Redirect to Discord's web app.
    window.location.href = 'https://discord.com/app';
  } else {
    // For Google or any other case, just go back to our app's home page.
    window.location.href = '/';
  }
};

  return (
    <div className="container py-5">
      <h1 className="mb-4">zkLogin Frontend (Client-Side ZK)</h1>

      {!user && (
        <div className="alert alert-info mb-3">
          <strong>Note:</strong> To log in with a different GitHub or Discord account, 
          please log out of those services first in another browser tab.
        </div>
      )}

      {user ? (
        <div className="card p-4 shadow">
          <h4>Welcome, {user.name}</h4>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Salt:</strong> <code>{user.salt}</code></p>

          <div className="mt-2">
            <button
              className="btn btn-primary"
              onClick={handleZKProof}
              disabled={loading}
            >
              {loading ? '⏳ Generating Proof...' : 'Generate ZK Proof (Client-Side)'}
            </button>
            <button
              className="btn btn-warning ms-2"
              onClick={handleRecoverSalt}
            >
              🔁 Recover Salt from MPC
            </button>
          </div>

          {proof && (
            <>
              <h5 className="mt-3">ZK Proof</h5>
              <pre className="bg-light p-2 rounded" style={{ maxHeight: '200px', overflow: 'auto' }}>
                {JSON.stringify(proof, null, 2)}
              </pre>
              <h5>Public Signals</h5>
              <pre className="bg-light p-2 rounded">
                {JSON.stringify(publicSignals, null, 2)}
              </pre>

              <button className="btn btn-success mt-3" onClick={handleVerify}>
                Verify ZK Proof (Server)
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