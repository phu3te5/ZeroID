import React, { useState } from 'react';

const ZKProofGenerator = ({ user, token }) => {
  const [inputs, setInputs] = useState({
    stid: '',
    aud: '',
    iss: '',
    salt: user?.salt || '',
    vku: '',
    T_exp: '',
    r: ''
  });
  const [proof, setProof] = useState(null);
  const [error, setError] = useState('');

  const handleChange = e => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };

  const generateProof = async () => {
    setError('');
    try {
      const res = await fetch('http://localhost:3001/api/zk/prove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(inputs)
      });
      const data = await res.json();
      if (data.proof) setProof(data);
      else setError(data.error || 'Proof generation failed');
    } catch (err) {
      setError('Request failed');
    }
  };

  return (
    <div>
      <h3>ZK Proof Generator</h3>
      <input name="stid" placeholder="stid" value={inputs.stid} onChange={handleChange} /><br />
      <input name="aud" placeholder="aud" value={inputs.aud} onChange={handleChange} /><br />
      <input name="iss" placeholder="iss" value={inputs.iss} onChange={handleChange} /><br />
      <input name="salt" placeholder="salt" value={inputs.salt} onChange={handleChange} /><br />
      <input name="vku" placeholder="vku" value={inputs.vku} onChange={handleChange} /><br />
      <input name="T_exp" placeholder="T_exp" value={inputs.T_exp} onChange={handleChange} /><br />
      <input name="r" placeholder="r" value={inputs.r} onChange={handleChange} /><br />
      <button onClick={generateProof}>Generate Proof</button>
      {proof && <pre>{JSON.stringify(proof, null, 2)}</pre>}
      {error && <div style={{color: 'red'}}>{error}</div>}
    </div>
  );
};

export default ZKProofGenerator;