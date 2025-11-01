//  server/controllers/mpcController.js
const mongoose = require('mongoose');
const SaltShare = require('../models/SaltShare');

async function storeSaltShare(req, res) {
  const { userId, shares } = req.body;

  // ✅ Convert string userId to ObjectId
  let objectId;
  try {
    objectId = new mongoose.Types.ObjectId(userId);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid userId format' });
  }

  try {
    await Promise.all(
      shares.map(share =>
        SaltShare.create({
          userId: objectId, // ← store as ObjectId
          share: share.share,
          part: share.part
        })
      )
    );
    res.json({ message: 'Shares stored successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error storing salt shares' });
  }
}

async function recoverSaltShares(req, res) {
  const { userId } = req.params;

  // ✅ Convert string to ObjectId
  let objectId;
  try {
    objectId = new mongoose.Types.ObjectId(userId);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid userId format' });
  }

  try {
    const shares = await SaltShare.find({ userId: objectId }).select('share part -_id');
    res.json({ shares });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error recovering shares' });
  }
}

module.exports = {
  storeSaltShare,
  recoverSaltShares
};