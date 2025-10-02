// server/controllers/mpcController.js
const SaltShare = require('../models/SaltShare');
const User = require('../models/User');

async function storeSaltShare(req, res) {
  const { userId, shares } = req.body; // shares = [{ share, part }]

  try {
    await Promise.all(
      shares.map(share =>
        SaltShare.create({
          userId,
          share: share.share,
          part: share.part
        })
      )
    );
    res.json({ message: 'Shares stored successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error storing salt shares');
  }
}

async function recoverSaltShares(req, res) {
  const { userId } = req.params;

  try {
    const shares = await SaltShare.find({ userId }).select('share part -_id');
    res.json({ shares });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error recovering shares');
  }
}

module.exports = {
  storeSaltShare,
  recoverSaltShares
};
