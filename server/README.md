# ZeroID Server (Verifier & MPC Node)

## 🛡️ Overview
The **ZeroID Server** acts as the cryptographic backbone of the ZeroID Authentication Platform. It serves two critical roles:
1.  **The Verifier:** Validates Groth16 Zero-Knowledge Proofs (ZKPs) received from the client using the circuit's verification key.
2.  **MPC Coordinator:** Handles the secure storage and recovery of cryptographic salts using Shamir's Secret Sharing (MPC) to ensure non-custodial identity management.

This server is stateless regarding user credentials—it never sees or stores passwords or raw OIDC tokens.

## 🚀 Technology Stack
* **Runtime:** Node.js (v18+)
* **Framework:** Express.js
* **Cryptography:** \`snarkjs\` (ZK Verification), \`circomlibjs\` (Poseidon Hash)
* **Database:** MongoDB (for storing MPC shares and user profiles)
* **Language:** JavaScript (ES6+)

---


## 🔌 API Endpoints

### 1. Authentication & Verification
These endpoints handle the Zero-Knowledge protocol flow.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | \`/api/auth/google\` | Initiates OIDC login flow with Google. |
| **POST** | \`/api/zk/verify\` | **The Core Verifier.** Receives \`{ proof, publicSignals }\`. Runs Bilinear Pairing check. Returns \`true\` if proof is valid. |

### 2. Multi-Party Computation (MPC)
These endpoints manage the "Cryptographic Salt" recovery mechanism.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | \`/api/mpc/store\` | Splits a new user's salt into 5 shares and stores them encrypted. |
| **GET** | \`/api/mpc/recover/:id\` | Recovers the minimum threshold (3 shares) to reconstruct the salt on the client. |

---

## 🛠️ Setup & Installation

1.  **Install Dependencies:**
    \`\`\`bash
    npm install express mongoose cors snarkjs dotenv
    \`\`\`

2.  **Prepare Circuit Files:**
    Ensure you copy your build artifacts (\`verification_key.json\`) from your Circom build folder into the \`server/circuits/\` directory.

3.  **Environment Variables:**
    Create a \`.env\` file:
    \`\`\`env
    PORT=3001
    MONGO_URI=mongodb://localhost:27017/zeroid
    JWT_SECRET=your_super_secret_session_key
    \`\`\`

4.  **Run the Server:**
    \`\`\`bash
    npm start
    # Server running on http://localhost:3001
    \`\`\`

---

## 🔐 Security Model (Dolev-Yao)

This server is designed to withstand a **Dolev-Yao adversary** (an attacker with full network control).

* **No Secret Transmission:** The user's password/JWT is never sent to this server. Only the mathematical proof \$\\pi\$ is transmitted.
* **Verification Key:** The server uses \`verification_key.json\` to mathematically certify that \`e(A, B) = e(C, D)\`.
* **Replay Protection:** (Future Work) The server enforces a unique \`nonce\` per session to prevent replay attacks.

---

## 📜 License
ZeroID is open-source software licensed under the MIT License.
