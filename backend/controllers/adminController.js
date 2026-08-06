// controllers/adminController.js — Full admin panel API (MySQL)
const { getDB } = require('../config/db');

// ── DASHBOARD SUMMARY ─────────────────────────
// GET /api/admin/summary
exports.getSummary = async (req, res) => {
  try {
    const db = getDB();
    const [[users]]     = await db.execute('SELECT COUNT(*) AS cnt FROM users');
    const [[hazards]]   = await db.execute('SELECT COUNT(*) AS cnt FROM hazards');
    const [[active]]    = await db.execute("SELECT COUNT(*) AS cnt FROM hazards WHERE status='active'");
    const [[critical]]  = await db.execute("SELECT COUNT(*) AS cnt FROM hazards WHERE severity='critical'");
    const [[donations]] = await db.execute('SELECT COUNT(*) AS cnt, SUM(amount) AS total FROM donations');
    const [[alerts]]    = await db.execute('SELECT COUNT(*) AS cnt FROM alert_logs');
    const [recent]      = await db.execute('SELECT * FROM hazards ORDER BY created_at DESC LIMIT 5');
    const [topDonors]   = await db.execute('SELECT donor_name,SUM(amount) AS total FROM donations GROUP BY donor_name ORDER BY total DESC LIMIT 5');

    res.json({
      success: true,
      summary: {
        totalUsers:     users.cnt,
        totalHazards:   hazards.cnt,
        activeHazards:  active.cnt,
        criticalAlerts: critical.cnt,
        totalDonations: donations.cnt,
        donationAmount: donations.total || 0,
        alertsSent:     alerts.cnt,
      },
      recentHazards: recent,
      topDonors,
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── ALL USERS ─────────────────────────────────
// GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const db = getDB();
    const [users] = await db.execute('SELECT id,name,email,role,location,alert_pref,notify_method,is_active,created_at FROM users ORDER BY created_at DESC');
    res.json({ success: true, count: users.length, data: users });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// PUT /api/admin/users/:id — change role or deactivate
exports.updateUser = async (req, res) => {
  try {
    const { role, is_active } = req.body;
    const db = getDB();

    // Prevent demoting self
    if (parseInt(req.params.id) === req.user.id)
      return res.status(400).json({ success: false, message: "You can't modify your own account here." });

    await db.execute('UPDATE users SET role=?,is_active=? WHERE id=?', [role, is_active, req.params.id]);
    res.json({ success: true, message: 'User updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id)
      return res.status(400).json({ success: false, message: "You can't delete yourself." });
    const db = getDB();
    await db.execute('DELETE FROM users WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── ALL HAZARDS (admin view) ──────────────────
// GET /api/admin/hazards
exports.getAllHazards = async (req, res) => {
  try {
    const db = getDB();
    const [rows] = await db.execute(`
      SELECT h.*, u.name AS reporter_name, u.email AS reporter_email
      FROM hazards h LEFT JOIN users u ON h.reported_by=u.id
      ORDER BY h.created_at DESC
    `);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── ALL DONATIONS ─────────────────────────────
// GET /api/admin/donations
exports.getAllDonations = async (req, res) => {
  try {
    const db = getDB();
    const [rows] = await db.execute('SELECT * FROM donations ORDER BY created_at DESC');
    const [[stats]] = await db.execute('SELECT SUM(amount) AS total, COUNT(*) AS count FROM donations');
    res.json({ success: true, data: rows, stats });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── ALERT LOGS ────────────────────────────────
// GET /api/admin/alerts
exports.getAlertLogs = async (req, res) => {
  try {
    const db = getDB();
    const [rows] = await db.execute(`
      SELECT al.*, h.name AS hazard_name, h.severity, u.name AS user_name
      FROM alert_logs al
      LEFT JOIN hazards h ON al.hazard_id=h.id
      LEFT JOIN users u   ON al.user_id=u.id
      ORDER BY al.sent_at DESC LIMIT 100
    `);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// ── RESOLVE HAZARD ────────────────────────────
// PUT /api/admin/hazards/:id/resolve
exports.resolveHazard = async (req, res) => {
  try {
    const db = getDB();
    await db.execute("UPDATE hazards SET status='resolved' WHERE id=?", [req.params.id]);
    res.json({ success: true, message: 'Hazard marked as resolved' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
