// server/config/oauth.js
require('dotenv').config();

module.exports = {
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3001/api/auth/google/callback"
  },
  github: {
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL}/api/auth/github/callback`,
    scope: ['user:email'],
    pkEndpoint: 'https://api.github.com/meta/public_keys/secret_scanning',
    issuer: 'https://github.com'
  },
  discord: {
  clientID: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  callbackURL: `${process.env.BASE_URL}/api/auth/discord/callback`,
  scope: ['identify', 'email'],
  pkEndpoint: 'https://discord.com/api/oauth2/token',
  issuer: 'https://discord.com'
},
  // Common configuration for zkLogin
  zkLogin: {
    sessionExpiry: 3600, // 1 hour in seconds
    hashAlgorithm: 'sha256',
    saltLength: 32,
    nonceLength: 32,
    // MPC Recovery configuration
    mpc: {
      shares: 5,
      threshold: 3,
      nodes: [
        { id: 1, url: process.env.MPC_NODE_1_URL },
        { id: 2, url: process.env.MPC_NODE_2_URL },
        { id: 3, url: process.env.MPC_NODE_3_URL },
        { id: 4, url: process.env.MPC_NODE_4_URL },
        { id: 5, url: process.env.MPC_NODE_5_URL }
      ]
    }
  }
};