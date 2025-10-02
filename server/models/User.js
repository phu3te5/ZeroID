// filepath: /home/omar/zklogin-mern/server/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  provider: String,
  providerId: String,
  name: String,
  email: String,
  salt: String
});

module.exports = mongoose.model('User', userSchema);