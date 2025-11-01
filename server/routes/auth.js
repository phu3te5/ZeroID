// server/routes/auth.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');

// Google: supports prompt=select_account
router.get('/google', authController.oauthLogin);
router.get('/google/callback', authController.oauthCallback);

// GitHub: standard flow (no fake prompt)
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback', 
  passport.authenticate('github', { failureRedirect: '/', session: false }),
  authController.handleOAuthCallback
);

// Discord: standard flow
router.get('/discord', passport.authenticate('discord', { scope: ['identify', 'email'] }));
router.get('/discord/callback',
  passport.authenticate('discord', { failureRedirect: '/', session: false }),
  authController.handleOAuthCallback
);

module.exports = router;