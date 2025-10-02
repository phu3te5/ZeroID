const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');

// Google : login + callback personnalisé
router.get('/google', authController.oauthLogin);
router.get('/google/callback', authController.oauthCallback);

// GitHub
router.get('/github', passport.authenticate('github'));
router.get('/github/callback', passport.authenticate('github', { failureRedirect: '/', session: false }), authController.handleOAuthCallback);

// Microsoft
router.get('/microsoft', passport.authenticate('microsoft'));
router.get('/microsoft/callback', passport.authenticate('microsoft', { failureRedirect: '/', session: false }), authController.handleOAuthCallback);

// Discord
router.get('/discord', passport.authenticate('discord'));
router.get('/discord/callback', passport.authenticate('discord', { failureRedirect: '/', session: false }), authController.handleOAuthCallback);
module.exports = router;