// client/src/components/DashboardView.js
import React from 'react';
import { InlineMath } from 'react-katex';

function DashboardView({
  user,
  proof,
  publicSignals,
  isVerified,
  loading,
  loadingStep,
  hasGrantedAccess,
  supportedProviders,
  onProofAndVerify,
  onRecoverSalt,
  onGrantAccess,
  onLogout,
}) {
  return (
    <div className="card p-4 shadow-soft" style={{ borderColor: 'var(--color-secondary)' }}>
      <h4 className="card-title text-themed-primary mb-3">Welcome Back, {user.name}</h4>

      <div className="mb-3 p-3 bg-light-themed rounded small border">
        <p className="mb-1">
          Provider: <span className="fw-bold text-dark">{user.provider.toUpperCase()}</span>
        </p>
        <p className="mb-1">
          Identity Status: <span className="fw-bold text-success">ZK-Private</span>
        </p>
        <p className="mb-0">
          Secret Salt (Proof Witness): <code className="text-danger">{user.salt}</code>
        </p>
      </div>

      <div className="d-flex flex-wrap gap-2 mb-4">
        <button
          className="btn btn-custom-primary flex-grow-1"
          onClick={onProofAndVerify}
          disabled={loading}
        >
          {loading ? `⏳ ${loadingStep}` : 'Authenticate with ZK'}
        </button>
        <button className="btn btn-warning" onClick={onRecoverSalt}>
          <span className="me-1">🔑</span> Recover Salt (MPC)
        </button>
      </div>

      {/* --- Verification Status --- */}
      {isVerified !== null && (
        <div className={`verify-status ${isVerified ? 'verified' : 'invalid'} shadow-sm`}>
          {isVerified ? '✅ ZK Proof is Valid' : '❌ ZK Proof is Invalid'}
        </div>
      )}

      {/* --- Full Access Section --- */}
      {isVerified === true && !hasGrantedAccess && supportedProviders.includes(user.provider) && (
        <div className="mt-4 p-3 rounded border border-warning" style={{ backgroundColor: '#F7E6E9' }}>
          <p className="mb-2 fw-bold text-dark">Grant Enhanced Access ({user.provider.toUpperCase()}):</p>
          <p className="text-muted small mb-2">
            Unlock full features by linking your complete {user.provider} identity.
          </p>
          <button
            className="btn btn-warning btn-sm"
            onClick={() => onGrantAccess(user.provider)}
          >
            <span className="me-1">🔓</span> Grant Full Access
          </button>
        </div>
      )}

      {/* --- Technical Details (Hidden by default) --- */}
      {proof && (
        <details className="mt-4">
          <summary className="text-themed-primary" style={{ cursor: 'pointer' }}>
            Show Technical Details (Proof & Signals)
          </summary>
          <div className="row mt-2">
            <div className="col-md-6 mb-2">
              <small className="d-block fw-bold mb-1">ZK Proof (<InlineMath math="\pi_{zk}" />)</small>
              <pre className="pre-themed">
                {JSON.stringify(proof, null, 2)}
              </pre>
            </div>
            <div className="col-md-6 mb-2">
              <small className="d-block fw-bold mb-1">Public Signals</small>
              <pre className="pre-themed">
                {JSON.stringify(publicSignals, null, 2)}
              </pre>
            </div>
          </div>
        </details>
      )}

      <button className="btn btn-outline-secondary mt-4" onClick={onLogout}>
        Logout
      </button>
    </div>
  );
}

export default DashboardView;