import React from 'react';

const OAuthButtons = () => (
  <div>
    <button
      onClick={() => window.location.href = 'http://localhost:3001/api/auth/google'}
    >
      Sign in with Google
    </button>
    {/* Add more OAuth providers here if needed */}
  </div>
);

export default OAuthButtons;