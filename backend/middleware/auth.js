const jwt = require('jsonwebtoken');
const { getDB } = require('../config/db');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer '))
    token = req.headers.authorization.split(' ')[1];
  if (!token) return res.status(401).json({ success:false, message:'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db = getDB();
    const [users] = await db.execute('SELECT * FROM users WHERE id=?', [decoded.id]);
    if (!users.length) return res.status(401).json({ success:false, message:'User not found' });
    req.user = users[0];
    next();
  } catch { return res.status(401).json({ success:false, message:'Token invalid' }); }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ success:false, message:'Admin only' });
};

module.exports = { protect, adminOnly };
