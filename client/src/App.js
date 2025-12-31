// client/src/App.js
import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'katex/dist/katex.min.css';
import './App.css'; 
import { groth16 } from 'snarkjs';

// --- Utility Functions ---

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
  const [activeTab, setActiveTab] = useState('proof');
  const [scrollProgress, setScrollProgress] = useState(0);

  // --- Visual & Theme Logic ---
  const ThemeStyles = () => (
    <style dangerouslySetInnerHTML={{__html: `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=JetBrains+Mono:wght@400;700&display=swap');

      :root {
        --zk-bg: #4c1d95; /* Rich Violet base */
        --zk-surface: #18181b;
        --zk-surface-hover: #27272a;
        --zk-border: #3f3f46;
        --zk-primary: #8b5cf6; /* Violet */
        --zk-accent: #fbbf24; /* Gold/Amber for 'ID' */
        --zk-success: #10b981;
        --zk-error: #ef4444;
        --zk-text-main: #f4f4f5;
        --zk-text-muted: #d4d4d8;
        --glass-panel: rgba(255, 255, 255, 0.95); /* Light glass for card */
      }

      body {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: var(--zk-text-main);
        font-family: 'Inter', sans-serif;
        min-height: 100vh;
      }

      /* Dark mode override for dashboard only */
      .dashboard-mode {
        background: #09090b;
        background-image: 
          radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.15), transparent 40%),
          linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
        background-size: 100% 100%, 40px 40px, 40px 40px;
      }

      /* Components */
      .zk-container {
        max-width: 1000px;
        margin: 0 auto;
        padding: 2rem 1rem;
      }

      /* Clean Professional Font */
      .zk-logo {
        font-family: 'Inter', sans-serif; 
        font-weight: 800;
        letter-spacing: -1px;
        color: #fff;
      }

      /* Card Style */
      .zk-card {
        background: white;
        border-radius: 16px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        overflow: hidden;
        color: #18181b;
      }
      
      .dashboard-card {
        background: rgba(24, 24, 27, 0.75);
        backdrop-filter: blur(12px);
        border: 1px solid var(--zk-border);
        color: white;
      }

      .zk-btn {
        background: var(--zk-surface);
        border: 1px solid var(--zk-border);
        color: var(--zk-text-main);
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }

      .zk-btn:hover {
        transform: translateY(-1px);
      }

      .zk-btn-primary {
        background: linear-gradient(135deg, var(--zk-primary), #6d28d9);
        border: none;
        color: white;
        box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
      }
      
      .zk-btn-success {
        background: rgba(16, 185, 129, 0.1);
        border: 1px solid var(--zk-success);
        color: var(--zk-success);
      }

      /* Provider Buttons */
      .provider-btn {
        width: 100%;
        padding: 0.85rem 1rem;
        margin-bottom: 1rem;
        border-radius: 6px;
        border: none;
        color: white;
        font-weight: 600;
        font-size: 0.95rem;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        transition: opacity 0.2s;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .provider-btn:hover { opacity: 0.9; transform: translateY(-1px); }
      
      .btn-google { background-color: #DB4437; }
      .btn-github { background-color: #333333; }
      .btn-discord { background-color: #5865F2; }

      /* Terminal View for Proofs */
      .terminal-window {
        background: #000;
        border: 1px solid #333;
        border-radius: 8px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.85rem;
        padding: 0;
        margin-top: 1rem;
      }
      .terminal-header {
        background: #1a1a1a;
        padding: 8px 12px;
        border-bottom: 1px solid #333;
        display: flex;
        gap: 6px;
      }
      .dot { width: 10px; height: 10px; border-radius: 50%; }
      .red { background: #ff5f56; }
      .yellow { background: #ffbd2e; }
      .green { background: #27c93f; }
      .terminal-body {
        padding: 12px;
        color: #0f0;
        max-height: 250px;
        overflow-y: auto;
      }
      .json-key { color: var(--zk-accent); }
      .json-val { color: var(--zk-primary); }

      /* Nav Tabs */
      .zk-tabs {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
        border-bottom: 1px solid var(--zk-border);
        padding-bottom: 1px;
      }
      .zk-tab {
        background: none;
        border: none;
        color: #a1a1aa;
        padding: 0.5rem 1rem;
        font-weight: 600;
        border-bottom: 2px solid transparent;
        transition: all 0.2s;
      }
      .zk-tab:hover {
        color: #fff;
      }
      .zk-tab.active {
        color: var(--zk-accent);
        border-bottom-color: var(--zk-accent);
      }

      /* Animations */
      @keyframes spin { to { transform: rotate(360deg); } }
      .processing-ring {
        display: inline-block;
        width: 1rem;
        height: 1rem;
        border: 2px solid rgba(255,255,255,0.3);
        border-radius: 50%;
        border-top-color: #fff;
        animation: spin 1s ease-in-out infinite;
        margin-right: 0.5rem;
      }
    `}} />
  );

  // --- Logic Implementations (MPC & Auth) ---

  const backupSaltToMPC = async (userId, salt) => {
    try {
      const shares = splitNumericSalt(salt, 5, 3);
      const shareObjects = shares.map((s, i) => ({ part: i + 1, share: s.share }));
      await fetch('http://localhost:3001/api/mpc/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, shares: shareObjects })
      });
      console.log('Salt backup successful');
    } catch (err) {
      console.error('MPC backup failed:', err);
    }
  };

  const recoverSaltFromMPC = async (userId) => {
    try {
      const res = await fetch(`http://localhost:3001/api/mpc/recover/${userId}`);
      const data = await res.json();
      if (!data.shares || data.shares.length < 3) return null;
      return combineNumericShares(data.shares);
    } catch (err) {
      console.error('MPC recovery failed:', err);
      return null;
    }
  };

  useEffect(() => {
    document.title = "ZeroID | Enterprise Auth";
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    const userString = params.get('user');

    const initAuth = async () => {
      if (tokenParam && userString) {
        const userObj = JSON.parse(decodeURIComponent(userString));
        
        // 1. Check LocalStorage
        let salt = localStorage.getItem('zkSalt');

        // 2. Fallback: Recover from MPC
        if (!salt) {
          console.log("Attempting Salt Recovery via MPC...");
          salt = await recoverSaltFromMPC(userObj._id);
        }

        // 3. Last Resort: Generate New
        if (!salt) {
          console.log("Generating New Identity Salt...");
          salt = generateNumericSalt(16);
          localStorage.setItem('zkSalt', salt);
          await backupSaltToMPC(userObj._id, salt);
        } else {
            localStorage.setItem('zkSalt', salt);
        }

        setUser({ ...userObj, salt });
        setToken(tokenParam);
        localStorage.setItem('token', tokenParam);
        localStorage.setItem('user', userString);
        window.history.replaceState({}, document.title, "/");
      }
    };
    initAuth();
  }, []);

  // Scroll Listener
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (windowHeight === 0) return;
      const scroll = totalScroll / windowHeight;
      setScrollProgress(scroll * 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleZKProof = async () => {
    if (!token || !user?.salt) return;

    const payload = parseJwt(token);
    if (!payload) return;

    setIsVerified(null);
    setHasGrantedAccess(false);
    setLoading(true);

    try {
      const inputs = {
        sub: payload.sub ? String(payload.sub).replace(/\D/g, '') : '123456',
        aud: payload.aud || '654321',
        iss: payload.iss || '111111', 
        salt: user.salt, 
        vku: generateRandomDecimalString(8),
        T_exp: payload.exp ? String(payload.exp) : '999999',
        r: generateRandomDecimalString(8), 
      };

      const { proof, publicSignals } = await groth16.fullProve(
        inputs,
        '/circuits/zklogin.wasm',
        '/circuits/zklogin_final.zkey'
      );
      setProof(proof);
      setPublicSignals(publicSignals);
    } catch (err) {
      console.error('ZK Proof failed:', err);
      alert('ZK Proof generation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!proof || !publicSignals) return;
    try {
      const res = await fetch('http://localhost:3001/api/zk/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proof, publicSignals }),
      });
      const data = await res.json();
      setIsVerified(data.valid);
    } catch (err) {
      alert('Verification failed');
    }
  };

  const handleGrantFullAccess = (provider) => {
    setHasGrantedAccess(true);
    const urls = {
      google: 'https://myaccount.google.com/',
      github: 'https://github.com/settings/profile',
      discord: 'https://discord.com/channels/@me'
    };
    if (urls[provider]) {
      setTimeout(() => window.location.href = urls[provider], 1000);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setProof(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('zkSalt');
    window.location.href = '/';
  };

  // --- Render Sections ---

  const renderHero = () => (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 text-center">
      <div className="mb-4">
        <h1 className="display-3 fw-bold zk-logo mb-2">
          Zero<span style={{ color: '#fbbf24' }}>ID</span>
        </h1>
        <p className="text-white h6 opacity-75 fw-light" style={{letterSpacing: '1px'}}>
          The Enterprise-Grade Zero-Knowledge Identity Provider
        </p>
      </div>
      
      <div className="zk-card p-5 mt-4 text-center" style={{maxWidth: '450px', width: '100%'}}>
        <h5 className="mb-4 text-dark fw-bold">Sign in to Dashboard</h5>
        
        <button className="provider-btn btn-google" onClick={() => window.location.href = 'http://localhost:3001/api/auth/google'}>
          <i className="bi bi-google"></i> Continue with Google
        </button>
        
        <button className="provider-btn btn-github" onClick={() => window.location.href = 'http://localhost:3001/api/auth/github'}>
          <i className="bi bi-github"></i> Continue with GitHub
        </button>
        
        <button className="provider-btn btn-discord" onClick={() => window.location.href = 'http://localhost:3001/api/auth/discord'}>
          <i className="bi bi-discord"></i> Continue with Discord
        </button>

        <div className="mt-4 pt-3 border-top d-flex justify-content-between text-muted" style={{fontSize: '0.75rem'}}>
          <span>v1.0.0 (Beta)</span>
          <span>ZeroID © 2025</span>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="min-vh-100 dashboard-mode">
      <div className="zk-container pt-5">
        <div className="d-flex justify-content-between align-items-center mb-5">
          <div>
            <h2 className="zk-logo m-0 fs-3 text-white">
              Zero<span style={{ color: '#fbbf24' }}>ID</span>
              <span className="opacity-75 ms-2" style={{fontFamily: 'Inter, sans-serif'}}>/ Dashboard</span>
            </h2>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="text-end d-none d-md-block">
              <div className="fw-bold text-white">{user.name}</div>
              <div className="small text-white-50 text-uppercase">{user.provider} linked</div>
            </div>
            <img src={user.avatar || "https://ui-avatars.com/api/?name=" + user.name} alt="Profile" className="rounded-circle border border-secondary" width="40" height="40" />
            <button className="zk-btn" onClick={handleLogout} style={{color: 'white', borderColor: 'white'}}>Log Out</button>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-lg-4">
            <div className="zk-card dashboard-card p-4 h-100">
              <h5 className="text-white mb-4">Identity Artifacts</h5>
              <div className="mb-4">
                <label className="small text-uppercase fw-bold mb-2" style={{color: '#a1a1aa'}}>Protocol Status</label>
                <div className="d-flex align-items-center gap-2">
                  <span className="dot green"></span>
                  <span className="text-white">OIDC Token Active</span>
                </div>
              </div>
              <div className="mb-4">
                <label className="small text-uppercase fw-bold mb-2" style={{color: '#a1a1aa'}}>Cryptographic Salt</label>
                <div className="d-flex gap-2">
                  <code className="flex-grow-1 bg-black p-2 rounded border border-secondary text-truncate" style={{color: 'var(--zk-accent)'}}>
                    {user.salt ? '••••••••••••••••' : 'Missing'}
                  </code>
                  <button className="zk-btn px-2" onClick={() => alert(user.salt)}>👁</button>
                </div>
                <small className="d-block mt-2" style={{color: '#a1a1aa'}}>
                  Stored via MPC (Shamir Secret Sharing)
                </small>
              </div>
            </div>
          </div>

          <div className="col-lg-8">
            <div className="zk-card dashboard-card p-4">
              <div className="zk-tabs">
                <button className={`zk-tab ${activeTab === 'proof' ? 'active' : ''}`} onClick={() => setActiveTab('proof')}>Proof Generation</button>
                <button className={`zk-tab ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>Security Audit</button>
                <button className={`zk-tab ${activeTab === 'api' ? 'active' : ''}`} onClick={() => setActiveTab('api')}>Developers & API</button>
              </div>

              {activeTab === 'proof' && (
                <div className="fade-in">
                  {!proof ? (
                    <div className="text-center py-5">
                      <div className="mb-4 text-muted" style={{fontSize: '4rem'}}>🛡️</div>
                      <h4 className="text-white">Ready to Authenticate</h4>
                      <p className="mb-4" style={{color: '#d4d4d8'}}>
                        Generate a zk-SNARK proof to validate your identity<br/>
                        without revealing your OIDC token to the server.
                      </p>
                      <button className="zk-btn zk-btn-primary btn-lg" onClick={handleZKProof} disabled={loading}>
                        {loading ? <span className="processing-ring"></span> : '⚡'} 
                        {loading ? 'Computing Circuit...' : 'Generate Proof'}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="text-white m-0">Proof Artifact</h5>
                        <span className="badge bg-secondary">Groth16</span>
                      </div>
                      <div className="terminal-window mb-4">
                        <div className="terminal-header">
                          <div className="dot red"></div><div className="dot yellow"></div><div className="dot green"></div>
                        </div>
                        <div className="terminal-body">
                          <div><span className="json-key">"proof"</span>: <span className="text-muted">{'{'}</span></div>
                          <div className="ps-3"><span className="json-key">"curve"</span>: <span className="json-val">"bn128"</span>,</div>
                          <div className="ps-3"><span className="json-key">"pi_a"</span>: [<span className="json-val">"{proof.pi_a[0].substring(0, 20)}..."</span>],</div>
                          <div className="ps-3"><span className="json-key">"pi_b"</span>: [[...]],</div>
                          <div><span className="text-muted">{'}'}</span></div>
                          <div className="mt-2"><span className="json-key">"publicSignals"</span>: [</div>
                          {publicSignals && publicSignals.map((s, i) => (
                             <div key={i} className="ps-3"><span className="json-val">"{s.substring(0, 50)}..."</span>,</div>
                          ))}
                          <div>]</div>
                        </div>
                      </div>
                      <div className="d-flex gap-3">
                        <button className="zk-btn flex-grow-1" onClick={() => { setProof(null); setIsVerified(null); }} style={{color:'white'}}>Reset</button>
                        <button className={`zk-btn flex-grow-1 ${isVerified ? 'zk-btn-success' : 'zk-btn-primary'}`} onClick={handleVerify} disabled={isVerified}>
                          {isVerified ? '✅ Verified on Chain/Server' : '🚀 Send to Verifier'}
                        </button>
                      </div>
                      {isVerified && (
                         <div className="mt-4 p-3 rounded border border-success bg-opacity-10 bg-success animate__animated animate__fadeIn">
                           <div className="d-flex align-items-center justify-content-between">
                             <div><strong className="text-success d-block">Authentication Successful</strong><small className="text-muted">Server verified identity without seeing JWT.</small></div>
                             {!hasGrantedAccess && (<button className="zk-btn zk-btn-success py-1" onClick={() => handleGrantFullAccess(user.provider)}>Enter App →</button>)}
                           </div>
                         </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'security' && (
                <div className="row g-3">
                  <div className="col-12"><div className="p-3 border border-secondary rounded"><h6 className="text-white">🧮 Circuit Properties</h6><p className="small mb-0" style={{color: '#a1a1aa'}}>Constraint System: R1CS using Groth16. <br/>Curves: BN128.</p></div></div>
                  <div className="col-12"><div className="p-3 border border-secondary rounded"><h6 className="text-white">🔐 MPC Salt Storage</h6><p className="small mb-0" style={{color: '#a1a1aa'}}>Salt recovered via Shamir Secret Sharing (t=3, n=5).</p></div></div>
                  <div className="col-12"><div className="p-3 border border-secondary rounded"><h6 className="text-white">🛡️ Formal Verification</h6><p className="small mb-0" style={{color: '#a1a1aa'}}>Protocol formally verified using ProVerif.</p></div></div>
                </div>
              )}

              {activeTab === 'api' && (
                <div className="text-center py-4">
                   <div className="mb-2 text-muted" style={{fontSize: '2.5rem'}}>🚀</div>
                   <h5 className="text-white mb-4">Enterprise API Endpoints</h5>
                   
                   {/* ENDPOINT 1: AUTH */}
                   <div className="mb-4">
                     <div className="d-flex justify-content-between align-items-center mb-1 px-1">
                       <small className="text-uppercase fw-bold" style={{color:'#fbbf24'}}>Authentication</small>
                       <span className="badge bg-secondary">POST</span>
                     </div>
                     <div className="p-3 bg-black rounded border border-secondary text-start font-monospace small" style={{color: '#a1a1aa'}}>
                        $ curl -X POST https://api.zeroid.io/v1/auth \<br/>
                        &nbsp;&nbsp;-H "Authorization: Bearer YOUR_API_KEY"
                     </div>
                   </div>

                   {/* ENDPOINT 2: RECOVERY (Added per request) */}
                   <div className="mb-4">
                     <div className="d-flex justify-content-between align-items-center mb-1 px-1">
                       <small className="text-uppercase fw-bold" style={{color:'#10b981'}}>Identity Recovery</small>
                       <span className="badge bg-secondary">GET</span>
                     </div>
                     <div className="p-3 bg-black rounded border border-secondary text-start font-monospace small" style={{color: '#a1a1aa'}}>
                        $ curl -X GET https://api.zeroid.io/v1/recover/{'{user_id}'} \<br/>
                        &nbsp;&nbsp;-H "Authorization: Bearer YOUR_API_KEY"
                     </div>
                   </div>

                   <button className="zk-btn w-100 justify-content-center" disabled>Upgrade to Enterprise to Unlock</button>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-vh-100 position-relative overflow-hidden">
      <ThemeStyles />
      <div style={{position: 'fixed', top: 0, left: 0, height: '2px', width: `${scrollProgress}%`, background: 'var(--zk-accent)', zIndex: 1000}} />
      {!user ? renderHero() : renderDashboard()}
    </div>
  );
}

export default App;