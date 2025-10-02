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

function oauthLogin(req, res) {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  res.redirect(url);
}

async function oauthCallback(req, res) {
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
  res.json({ token: jwt, user });
}

module.exports = {
  oauthLogin,
  oauthCallback
};
