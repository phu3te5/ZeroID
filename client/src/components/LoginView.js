// client/src/components/LoginView.js
import React from 'react';

function LoginView({ onLoginGoogle, onLoginGithub, onLoginDiscord }) {
  return (
    <>
      <div className="alert alert-info-themed mb-4 shadow-sm text-center">
        <strong>Note:</strong> To use a different GitHub or Discord account,
        please log out of those services in another browser tab first.
      </div>

      <div className="d-flex flex-column gap-3 p-4 bg-white rounded shadow-soft card-themed">
        <h5 className="text-center text-themed-primary mb-3">
          Authenticate with Provider:
        </h5>
        <button
          className="btn btn-google-dynamic btn-lg shadow-sm"
          onClick={onLoginGoogle}
        >
          Login with Google
        </button>
        <button
          className="btn btn-dark btn-lg shadow-sm"
          onClick={onLoginGithub}
        >
          Login with GitHub
        </button>
        <button
          className="btn btn-primary btn-lg shadow-sm"
          onClick={onLoginDiscord}
        >
          Login with Discord
        </button>
      </div>
    </>
  );
}

export default LoginView;
