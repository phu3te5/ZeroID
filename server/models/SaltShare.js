const mongoose = require('mongoose');

const SaltShareSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  share: String, // Une part du salt (ex: via Shamir's Secret Sharing)
  part: Number,  // Numéro d'ordre de la part
});

module.exports = mongoose.model('SaltShare', SaltShareSchema);
