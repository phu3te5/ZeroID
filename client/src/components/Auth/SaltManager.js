import React, { useState } from 'react';

const SaltManager = ({ user, token }) => {
  const [salt, setSalt] = useState(user?.salt || '');
  const [message, setMessage] = useState('');

  const regenerateSalt = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/mpc/regenerate-salt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId: user._id })
      });
      const data = await res.json();
      setSalt(data.salt);
      setMessage('Salt regenerated!');
    } catch (err) {
      setMessage('Error regenerating salt');
    }
  };

  return (
    <div>
      <h3>Salt Manager</h3>
      <div>Current salt: <code>{salt}</code></div>
      <button onClick={regenerateSalt}>Regenerate Salt</button>
      {message && <div>{message}</div>}
    </div>
  );
};

export default SaltManager;