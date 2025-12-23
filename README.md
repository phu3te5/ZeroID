# ZeroID: Privacy-Preserving Authentication with ZK-SNARKs & MPC

> **A decentralized identity system featuring privacy-preserving authentication (Groth16), Multi-Party Computation (MPC) for salt recovery, and formal security verification using ProVerif.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Stack](https://img.shields.io/badge/Stack-MERN-blue)](https://mongodb.com)
[![ZK Protocol](https://img.shields.io/badge/Protocol-Groth16-green)](https://eprint.iacr.org/2016/260)
[![Verification](https://img.shields.io/badge/Formal%20Verification-ProVerif-purple)](https://proverif.inria.fr/)

---

## 📖 Abstract

**ZeroID** is a hybrid authentication and identity framework that bridges **Web2 OAuth identity providers** with **Web3-grade privacy guarantees** using **Zero-Knowledge Proofs (ZK-SNARKs)**.

Traditional authentication systems require servers to store password hashes and salts, creating centralized points of failure. **ZeroID eliminates this trust assumption** by enabling users to authenticate via OAuth (Google, GitHub, Discord) while proving identity possession **without revealing secrets**.

A **Groth16 Zero-Knowledge Proof** is generated client-side, and a **Shamir’s Secret Sharing (MPC)** mechanism distributes the user’s cryptographic salt across multiple storage nodes to ensure resilience against local data loss. The server only verifies cryptographic proofs and never learns private credentials.

All security properties are **formally verified** using **Applied Pi Calculus** and **ProVerif**, providing mathematical guarantees of secrecy, authentication, and unlinkability.

---

## 🏗️ System Architecture

ZeroID is composed of three tightly integrated components:

1. **Frontend (React + SnarkJS)**  
   - OAuth login
   - Salt reconstruction via MPC
   - Client-side ZK proof generation (Groth16)

2. **Backend (Node.js + Express)**  
   - OAuth session handling (Passport.js)
   - ZK proof verification
   - MPC share storage (MongoDB)

3. **Formal Verification (ProVerif)**  
   - Mathematical model of the protocol
   - Verification under the Dolev–Yao attacker model

---

## 🔐 Authentication Flow

```mermaid
sequenceDiagram
    participant U as User (Client)
    participant OA as OAuth Provider
    participant S as Server
    participant DB as MongoDB (MPC Shares)

    U->>OA: 1. OAuth Login (Google / GitHub / Discord)
    OA-->>U: 2. OAuth Token & Profile

    rect rgb(240,248,255)
    note right of U: MPC Salt Recovery
    U->>DB: 3. Request Salt Shares
    DB-->>U: 4. Return Shares
    U->>U: 5. Reconstruct Salt (Lagrange Interpolation)
    end

    rect rgb(255,240,245)
    note right of U: Zero-Knowledge Phase
    U->>U: 6. Generate ZK Proof (Poseidon Hash)
    U->>S: 7. Submit Proof + Public Signals
    S->>S: 8. Verify Proof (Groth16)
    end

    alt Proof Valid
        S-->>U: 9. Access Granted
    else Invalid
        S-->>U: 10. Access Denied
    end
