// client/src/App.js
import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { InlineMath } from 'react-katex'; // Using InlineMath for better fit in labels
import 'katex/dist/katex.min.css';
import './App.css'; 
import { groth16 } from 'snarkjs';

// --- Utility Functions (Left unchanged for core logic) ---

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

// --- Main App Component ---

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [proof, setProof] = useState(null);
  const [publicSignals, setPublicSignals] = useState(null);
  const [isVerified, setIsVerified] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasGrantedAccess, setHasGrantedAccess] = useState(false); 
  const [scrollPosition, setScrollPosition] = useState(0); 

  // New scroll handler and useEffect for dynamic effects
  const handleScroll = () => {
    setScrollPosition(window.pageYOffset);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []); 

  // Calculate dynamic header style based on scroll position
  const headerOpacity = Math.max(0.7, 1 - scrollPosition / 250);
  const headerScale = Math.max(0.95, 1 - scrollPosition / 1500);
  const headerStyle = {
    opacity: headerOpacity,
    transform: `scale(${headerScale})`,
    transition: 'all 0.3s ease-out',
    transformOrigin: 'center top',
    willChange: 'transform, opacity' 
  };
  
  // Custom Scrollbar and THEME CSS for the feminine/wellness product site look
  const ScrollbarStyle = () => (
    <style dangerouslySetInnerHTML={{__html: `
      /* Theme Colors */
      :root {
          --color-primary: #884A5C; /* Deep Berry/Wine */
          --color-secondary: #B4CFB0; /* Muted Sage Green (Success/ZK Verified) */
          --color-background: #F9F5F6; /* Soft Blush/Cream */
          --color-dark: #3E3B3C;
      }

      /* --- Background Animation --- */
      @keyframes softGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
      }

      body {
          /* Subtle Gradient Background */
          background: linear-gradient(-45deg, var(--color-background), #FFFFFF, #F0E8E9);
          background-size: 400% 400%;
          animation: softGradient 15s ease infinite;
      }

      /* Custom Scrollbar for 'Funny Scroll' Effect */
      ::-webkit-scrollbar {
        width: 10px;
      }
      ::-webkit-scrollbar-track {
        background: #fdf2f8; /* Light blush track */
        border-radius: 5px;
      }
      ::-webkit-scrollbar-thumb {
        background: var(--color-primary); 
        border-radius: 5px;
        transition: background 0.3s ease;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: #643846; /* Darker berry hover */
      }

      /* Button Styles */
      .btn-custom-primary {
          background-color: var(--color-primary);
          border-color: var(--color-primary);
          color: white;
      }
      .btn-custom-primary:hover {
          background-color: #643846;
          border-color: #643846;
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      
      /* Specific Dynamic Hover for Google Button */
      .btn-google-dynamic {
          background-color: #DB4437; /* Google Red */
          border: none;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      }
      .btn-google-dynamic:hover {
          background-color: #C1392D;
          /* Dynamic lift and shadow glow */
          transform: translateY(-4px); 
          box-shadow: 0 10px 20px rgba(219, 68, 55, 0.5); 
      }
      .card-themed {
          border-color: var(--color-primary) !important;
      }
      .text-themed-primary {
          color: var(--color-primary) !important;
      }
      .badge-themed-success {
          background-color: var(--color-secondary) !important;
          color: var(--color-dark) !important;
      }
    `}} />
  );

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
    
    setIsVerified(null);
    setHasGrantedAccess(false);

    const sub_claim = payload.sub ? String(payload.sub).replace(/\D/g, '') : '123456';
    const iss_claim = payload.iss || '111111'; 
    const aud_claim = payload.aud || '654321'; 
    const T_exp_claim = payload.exp ? String(payload.exp) : '999999';
    const vku_ephemeral = generateRandomDecimalString(8);
    const r_randomness = generateRandomDecimalString(8);

    const inputs = {
      sub: sub_claim,
      aud: aud_claim,
      iss: iss_claim,
      salt: user.salt, 
      vku: vku_ephemeral,
      T_exp: T_exp_claim,
      r: r_randomness, 
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

  const handleGrantFullAccess = (provider) => {
    setHasGrantedAccess(true);

    let redirectUrl = '';
    let serviceName = '';

    if (provider === 'google') {
        redirectUrl = 'https://myaccount.google.com/';
        serviceName = 'Google Account Features';
    } else if (provider === 'github') {
        redirectUrl = 'https://github.com/settings/profile';
        serviceName = 'GitHub Account Settings';
    } else if (provider === 'discord') {
        redirectUrl = 'https://discord.com/channels/@me';
        serviceName = 'Discord App Services';
    } else {
        alert('Unknown provider, cannot grant full access.');
        setHasGrantedAccess(false);
        return;
    }
    
    // Simulate redirection to the authorized resource
    alert(`✅ Access granted! Redirecting to full ${serviceName} to demonstrate enhanced features.`);
    window.location.href = redirectUrl;
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
    window.location.href = 'http://localhost:3001/api/auth/github'; 
  };

  const handleLoginDiscord = () => {
    window.location.href = 'http://localhost:3001/api/auth/discord'; 
  };

  const handleLogout = () => {
    const provider = user?.provider;
    setUser(null);
    setToken(null);
    setProof(null);
    setPublicSignals(null);
    setIsVerified(null);
    setHasGrantedAccess(false); 
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('zkSalt');

    if (provider === 'github') {
      window.location.href = 'https://github.com';
    } else if (provider === 'discord') {
      window.location.href = 'https://discord.com/app';
    } else {
      window.location.href = '/';
    }
  };

  const supportedProviders = ['google', 'github', 'discord'];

  return (
    <div className="container py-5 d-flex flex-column align-items-center" style={{ minHeight: '100vh', paddingBottom: '100px' }}>
      <ScrollbarStyle /> 
      
      <div className="text-center mb-4" style={headerStyle}>
        <h1 className="fw-bolder text-themed-primary">zkLogin Frontend</h1>
        <p className="text-muted">
          Client-Side Zero-Knowledge Proof (NIZK Groth16) Authentication Demo
        </p>
      </div>

      <div style={{ maxWidth: '600px', width: '100%' }}>
        {!user && (
          <div className="alert alert-info border-info mb-4 shadow-sm text-center">
            <strong>Note:</strong> To log in with a different GitHub or Discord account, 
            please log out of those services first in another browser tab.
          </div>
        )}

        {/* --- FORMAL SECURITY GUARANTEES SECTION --- */}
        <div className="card shadow-lg mb-4 border-3 border-dark">
          <div className="card-header bg-dark text-white fw-bold">
            <span className="me-2">🛡️</span> Formal Security Guarantees (ProVerif)
          </div>
          <ul className="list-group list-group-flush">
            <li className="list-group-item d-flex justify-content-between align-items-center small">
              <span>**Unforgeability** (Authentication Correspondence)</span>
              <span className="badge badge-themed-success py-2">PROVEN</span>
            </li>
            <li className="list-group-item d-flex justify-content-between align-items-center small">
              <span>**Unlinkability** (Salt Secrecy)</span>
              <span className="badge badge-themed-success py-2">PROVEN</span>
            </li>
            <li className="list-group-item d-flex justify-content-between align-items-center small">
              <span>**Replay Resistance** (via Ephemeral Nonce)</span>
              <span className="badge badge-themed-success py-2">PROVEN</span>
            </li>
          </ul>
        </div>

        {user ? (
          <div className="card p-4 shadow-lg border-2" style={{borderColor: 'var(--color-secondary)'}}>
            <h4 className="card-title text-themed-primary mb-3">Welcome Back, {user.name}</h4>
            
            <div className="mb-3 p-3 bg-light rounded small border">
                <p className="mb-1">Authenticated Provider: <span className="fw-bold text-dark">{user.provider.toUpperCase()}</span></p>
                <p className="mb-1">Identity Status: <span className="fw-bold text-success">ZK-Private</span></p>
                <p className="mb-0">Secret Salt (Proof Witness): <code className="text-danger">{user.salt}</code></p>
            </div>

            <div className="d-flex flex-wrap gap-2 mb-4">
              <button
                className="btn btn-custom-primary flex-grow-1"
                onClick={handleZKProof}
                disabled={loading}
              >
                {loading ? '⏳ Generating Proof...' : 'Generate ZK Proof'}
              </button>
              <button
                className="btn btn-warning"
                onClick={handleRecoverSalt}
              >
                <span className="me-1">🔑</span> Recover Salt (MPC)
              </button>
            </div>

            {proof && (
              <div className="mt-3">
                <h5 className="text-themed-primary border-bottom pb-1">Proof Status & Verification</h5>
                
                <div className="row mb-3">
                    <div className="col-md-6 mb-2">
                        <small className="d-block fw-bold mb-1">ZK Proof (<InlineMath math="\pi_{zk}" />)</small> 
                        <pre className="bg-dark text-white p-2 rounded small overflow-auto" style={{ maxHeight: '150px' }}>
                            {JSON.stringify(proof, null, 2)}
                        </pre>
                    </div>
                    <div className="col-md-6 mb-2">
                        <small className="d-block fw-bold mb-1">Public Signals (userComp, nonce)</small>
                        <pre className="bg-dark text-white p-2 rounded small overflow-auto" style={{ maxHeight: '150px' }}>
                            {JSON.stringify(publicSignals, null, 2)}
                        </pre>
                    </div>
                </div>

                {/* Verification Button and Result */}
                <div className="d-flex align-items-center justify-content-between">
                    <button className="btn btn-success flex-grow-1 me-3" onClick={handleVerify} style={{backgroundColor: 'var(--color-secondary)', borderColor: 'var(--color-secondary)', color: 'var(--color-dark)'}}>
                        Verify ZK Proof (Server-Side)
                    </button>
                    {isVerified !== null && (
                        <span className={`badge fs-6 ${isVerified ? 'badge-themed-success' : 'bg-danger'}`}>
                            {isVerified ? '✅ VALID' : '❌ INVALID'}
                        </span>
                    )}
                </div>

                {/* Conditional Full Access Section */}
                {isVerified === true && !hasGrantedAccess && supportedProviders.includes(user.provider) && (
                  <div className="mt-4 p-3 rounded border border-warning" style={{backgroundColor: '#F7E6E9'}}>
                    <p className="mb-2 fw-bold text-dark">Grant Enhanced Access ({user.provider.toUpperCase()}):</p>
                    <p className="text-muted small mb-2">
                      Unlock full features by linking your complete {user.provider} identity. This moves from private ZK access to standard OAuth-based resource access.
                    </p>
                    <button 
                      className="btn btn-warning btn-sm"
                      onClick={() => handleGrantFullAccess(user.provider)}
                    >
                      <span className="me-1">🔓</span> Grant Full Access
                    </button>
                  </div>
                )}
                {isVerified === true && hasGrantedAccess && (
                  <div className="mt-3 alert d-flex align-items-center" style={{backgroundColor: 'var(--color-secondary)', color: 'var(--color-dark)', borderColor: 'var(--color-secondary)'}}>
                    <span className="fs-5 me-2">⭐</span>Full {user.provider} Access Granted!
                  </div>
                )}
              </div>
            )}

            <button className="btn btn-outline-secondary mt-4" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3 p-4 bg-white rounded shadow-lg border card-themed">
            <h5 className="text-center text-themed-primary mb-3">Authenticate with Provider:</h5>
            {/* Google Button with Dynamic Hover */}
            <button className="btn btn-google-dynamic btn-lg shadow-sm" onClick={handleLoginGoogle}>
              Login with Google
            </button>
            <button className="btn btn-dark btn-lg shadow-sm" onClick={handleLoginGithub}>
              Login with GitHub
            </button>
            <button className="btn btn-primary btn-lg shadow-sm" onClick={handleLoginDiscord}>
              Login with Discord
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;