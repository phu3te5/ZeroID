const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET;

function generateToken(user) {
  return jwt.sign({ id: user._id, email: user.email }, SECRET, { expiresIn: '1h' });
}

module.exports = { generateToken };
