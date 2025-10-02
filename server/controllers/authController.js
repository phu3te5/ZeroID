// server/controllers/authController.js
const { generateSalt } = require('../utils/crypto');
const { generateToken } = require('../utils/jwt');
const User = require('../models/User');

// Fonction générique pour tous les fournisseurs OAuth
async function handleOAuthCallback(req, res) {
  try {
    const profile = req.user;
    let user = await User.findOne({ providerId: profile.id });

    if (!user) {
      const salt = generateSalt();
      user = await User.create({
        provider: profile.provider,       // e.g. 'github', 'discord'
        providerId: profile.id,
        name: profile.displayName || profile.username || 'Anonymous',
        email: profile.emails?.[0]?.value || profile.email,
        salt
      });
    }

    const token = generateToken(user);
    const encodedUser = encodeURIComponent(JSON.stringify(user));
    res.redirect(`http://localhost:3000/?token=${token}&user=${encodedUser}`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.status(500).send('OAuth callback failed');
  }
}

// Si tu veux garder Google séparé pour le moment :
const { google } = require('googleapis');
const oauthConfig = require('../config/oauth');

const oauth2Client = new google.auth.OAuth2(
  oauthConfig.google.clientID,
  oauthConfig.google.clientSecret,
  oauthConfig.google.callbackURL
);

const SCOPES = ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'];

function oauthLogin(req, res) {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  res.redirect(url);
}

async function oauthCallback(req, res) {
  try {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
    const { data } = await oauth2.userinfo.get();

    let user = await User.findOne({ providerId: data.id });
    if (!user) {
      const salt = generateSalt();
      user = await User.create({
        provider: 'google',
        providerId: data.id,
        name: data.name,
        email: data.email,
        salt
      });
    }

    const jwt = generateToken(user);
    const encodedUser = encodeURIComponent(JSON.stringify(user));
    res.redirect(`http://localhost:3000/?token=${jwt}&user=${encodedUser}`);
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    res.status(500).send('OAuth callback failed');
  }
}

module.exports = {
  oauthLogin,
  oauthCallback,
  handleOAuthCallback
};
