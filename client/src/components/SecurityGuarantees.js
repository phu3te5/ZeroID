// client/src/components/SecurityGuarantees.js
import React from 'react';

function SecurityGuarantees() {
  return (
    <div className="card shadow-soft mb-4 card-security-themed">
      <div className="card-header fw-bold">
        <span className="me-2">🛡️</span> Formal Security Guarantees (ProVerif)
      </div>
      <ul className="list-group list-group-flush">
        <li className="list-group-item d-flex justify-content-between align-items-center small">
          <span>**Unforgeability** (Authentication)</span>
          <span className="badge badge-themed-success py-2">PROVEN</span>
        </li>
        <li className="list-group-item d-flex justify-content-between align-items-center small">
          <span>**Unlinkability** (Salt Secrecy)</span>
          <span className="badge badge-themed-success py-2">PROVEN</span>
        </li>
        <li className="list-group-item d-flex justify-content-between align-items-center small">
          <span>**Replay Resistance** (Nonce)</span>
          <span className="badge badge-themed-success py-2">PROVEN</span>
        </li>
      </ul>
    </div>
  );
}

export default SecurityGuarantees;