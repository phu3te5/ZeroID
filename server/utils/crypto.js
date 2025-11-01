//server/utils/crypto.js
const crypto = require('crypto');

function generateSalt(length = 16) {
  return crypto.randomBytes(length).toString('hex');
}

function hashWithSalt(data, salt) {
  return crypto.createHash('sha256').update(data + salt).digest('hex');
}

module.exports = { generateSalt, hashWithSalt };
