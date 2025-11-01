// server/controllers/authController.js
const { google } = require('googleapis');
const User = require('../models/User');
const { generateSalt } = require('../utils/crypto');
const { generateToken } = require('../utils/jwt');
const oauthConfig = require('../config/oauth');

const oauth2Client = new google.auth.OAuth2(
  oauthConfig.google.clientID,
  oauthConfig.google.clientSecret,
  oauthConfig.google.callbackURL
);

const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
];

async function handleOAuthCallback(req, res) {
  try {
    const profile = req.user;
    let user = await User.findOne({ providerId: profile.id });
    if (!user) {
      const salt = generateSalt();
      user = await User.create({
        provider: profile.provider || 'unknown',
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

function oauthLogin(req, res) {
  const { prompt = 'select_account' } = req.query;
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt // only works for Google
  });
  res.redirect(url);
}

async function oauthCallback(req, res) {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).send('Authorization code missing.');
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
    const { data } = await oauth2.userinfo.get();
    let user = await User.findOne({ providerId: data.id, provider: 'google' });
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