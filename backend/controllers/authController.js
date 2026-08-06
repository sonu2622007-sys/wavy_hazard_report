// controllers/authController.js — MySQL + Welcome Email
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { getDB } = require('../config/db');
const { sendWelcomeEmail } = require('../services/emailService');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const sendToken = (user, statusCode, res) => {
  const token = signToken(user.id);
  const { password, ...safe } = user;
  res.status(statusCode).json({ success: true, token, user: safe });
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, location } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Name, email and password required.' });

    if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]).{8,}$/.test(password))
      return res.status(400).json({ success: false, message: 'Password must have 8+ chars, uppercase, number & special character.' });

    const db = getDB();
    const [existing] = await db.execute('SELECT id FROM users WHERE email=?', [email.toLowerCase()]);
    if (existing.length > 0)
      return res.status(409).json({ success: false, message: 'Email already registered.' });

    const hashed = await bcrypt.hash(password, 12);
    const [result] = await db.execute(
      'INSERT INTO users (name,email,password,location) VALUES (?,?,?,?)',
      [name, email.toLowerCase(), hashed, location || 'Chennai, Tamil Nadu']
    );
    const [users] = await db.execute('SELECT * FROM users WHERE id=?', [result.insertId]);
    const user = users[0];

    // Send welcome email (async, don't block)
    sendWelcomeEmail(user).catch(() => {});

    sendToken(user, 201, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required.' });

    const db = getDB();
    const [users] = await db.execute('SELECT * FROM users WHERE email=?', [email.toLowerCase()]);
    if (!users.length)
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    const match = await bcrypt.compare(password, users[0].password);
    if (!match)
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    sendToken(users[0], 200, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  const { password, ...safe } = req.user;
  res.status(200).json({ success: true, user: safe });
};

// PUT /api/auth/settings
exports.updateSettings = async (req, res) => {
  try {
    const { location, alertPreference, notifyMethod } = req.body;
    const db = getDB();
    await db.execute(
      'UPDATE users SET location=?,alert_pref=?,notify_method=? WHERE id=?',
      [location, alertPreference, notifyMethod, req.user.id]
    );
    const [users] = await db.execute('SELECT * FROM users WHERE id=?', [req.user.id]);
    const { password, ...safe } = users[0];
    res.status(200).json({ success: true, user: safe });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
