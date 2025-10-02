// A simple React frontend with Google login and ZK Proof UI
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [user, setUser] = useState(null);
  const [, setToken] = useState(null); // token is unused, suppress warning
  const [proof, setProof] = useState(null);
  const [publicSignals, setPublicSignals] = useState(null);
  const [isVerified, setIsVerified] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    const userString = params.get("user");
    if (tokenParam && userString) {
      setToken(tokenParam);
      setUser(JSON.parse(decodeURIComponent(userString)));
    }
  }, []);

  const handleZKProof = async () => {
    try {
      const res = await axios.post("http://localhost:3001/api/zk/prove", {
        stid: "123",
        aud: "456",
        iss: "789",
        salt: "1234567890",
        vku: "345",
        T_exp: "1000000",
        r: "42"
      });
      setProof(res.data.proof);
      setPublicSignals(res.data.publicSignals);
    } catch (err) {
      alert("ZK Proof error: " + err.message);
    }
  };

  const handleVerify = async () => {
    try {
      const res = await axios.post("http://localhost:3001/api/zk/verify", {
        proof,
        publicSignals
      });
      setIsVerified(res.data.valid);
    } catch (err) {
      alert("Verification error: " + err.message);
    }
  };

  const handleLoginGoogle = () => {
    window.location.href = "http://localhost:3001/api/auth/google";
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>zkLogin Frontend</h1>
      {user ? (
        <div>
          <p>Welcome, {user.name}</p>
          <p>Email: {user.email}</p>
          <button onClick={handleZKProof}>Generate ZK Proof</button>
          {proof && (
            <>
              <pre>{JSON.stringify(proof, null, 2)}</pre>
              <pre>{JSON.stringify(publicSignals, null, 2)}</pre>
              <button onClick={handleVerify}>Verify ZK Proof</button>
              {isVerified !== null && (
                <p>Verification result: {isVerified ? "✅ Valid" : "❌ Invalid"}</p>
              )}
            </>
          )}
        </div>
      ) : (
        <button onClick={handleLoginGoogle}>Login with Google</button>
      )}
    </div>
  );
}

export default App;
