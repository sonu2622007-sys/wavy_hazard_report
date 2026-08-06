// controllers/hazardController.js — MySQL + Email alerts on new hazard
const { getDB } = require('../config/db');
const { sendHazardAlert } = require('../services/emailService');

// GET /api/hazards
exports.getHazards = async (req, res) => {
  try {
    const db = getDB();
    let sql = 'SELECT h.*,u.name AS reporter_name FROM hazards h LEFT JOIN users u ON h.reported_by=u.id WHERE 1=1';
    const params = [];
    if (req.query.severity) { sql += ' AND h.severity=?'; params.push(req.query.severity); }
    if (req.query.type)     { sql += ' AND h.type=?';     params.push(req.query.type); }
    if (req.query.status)   { sql += ' AND h.status=?';   params.push(req.query.status); }
    sql += ' ORDER BY h.created_at DESC';
    const [hazards] = await db.execute(sql, params);
    res.json({ success: true, count: hazards.length, data: hazards });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/hazards/stats
exports.getStats = async (req, res) => {
  try {
    const db = getDB();
    const [[tot]]   = await db.execute('SELECT COUNT(*) AS cnt FROM hazards');
    const [[crit]]  = await db.execute("SELECT COUNT(*) AS cnt FROM hazards WHERE severity='critical'");
    const [[warn]]  = await db.execute("SELECT COUNT(*) AS cnt FROM hazards WHERE severity='warning'");
    const [[mon]]   = await db.execute("SELECT COUNT(*) AS cnt FROM hazards WHERE severity='monitor'");
    const [[act]]   = await db.execute("SELECT COUNT(*) AS cnt FROM hazards WHERE status='active'");
    const [[res2]]  = await db.execute("SELECT COUNT(*) AS cnt FROM hazards WHERE status='resolved'");
    const [byType]  = await db.execute('SELECT type AS _id,COUNT(*) AS count FROM hazards GROUP BY type ORDER BY count DESC');
    res.json({ success: true, stats: { total:tot.cnt, critical:crit.cnt, warning:warn.cnt, monitor:mon.cnt, active:act.cnt, resolved:res2.cnt, byType } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/hazards/geo
exports.getGeoData = async (req, res) => {
  try {
    const db = getDB();
    const [hazards] = await db.execute("SELECT id,name,type,severity,location_desc,lat,lng,wind_speed,wave_height FROM hazards WHERE status!='resolved'");
    const data = hazards.map(h => ({ ...h, location: { description: h.location_desc, coordinates: { lat: h.lat, lng: h.lng } } }));
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/hazards/:id
exports.getHazard = async (req, res) => {
  try {
    const db = getDB();
    const [rows] = await db.execute('SELECT * FROM hazards WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// POST /api/hazards
exports.createHazard = async (req, res) => {
  try {
    const { type, name, severity, location, description, windSpeed, waveHeight, affectedPeople } = req.body;
    const db = getDB();
    const [result] = await db.execute(
      'INSERT INTO hazards (type,name,severity,location_desc,lat,lng,description,wind_speed,wave_height,affected_people,reported_by,source) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      [type, name, severity,
       location?.description || '', location?.coordinates?.lat || null, location?.coordinates?.lng || null,
       description || '', windSpeed || null, waveHeight || null, affectedPeople || 0,
       req.user?.id || null, 'user']
    );
    const [rows] = await db.execute('SELECT * FROM hazards WHERE id=?', [result.insertId]);
    const hazard = rows[0];

    // Real-time socket emit
    const io = req.app.get('io');
    if (io) io.emit('new_hazard', { id: hazard.id, type: hazard.type, name: hazard.name, severity: hazard.severity, location: hazard.location_desc });

    // Send email alerts to all users with matching alert preference
    const db2 = getDB();
    const [users] = await db2.execute(
      "SELECT * FROM users WHERE is_active=1 AND (alert_pref='all' OR (alert_pref='critical' AND ?) OR (alert_pref='cyclone' AND ?))",
      [severity === 'critical', type === 'Cyclone']
    );
    if (users.length > 0) {
      sendHazardAlert(hazard, users).catch(() => {});
      // Log alerts
      for (const u of users) {
        await db2.execute(
          'INSERT INTO alert_logs (hazard_id,user_id,email,type) VALUES (?,?,?,?)',
          [hazard.id, u.id, u.email, 'new_hazard']
        ).catch(() => {});
      }
    }

    res.status(201).json({ success: true, data: hazard });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

// PUT /api/hazards/:id  (admin)
exports.updateHazard = async (req, res) => {
  try {
    const { status, severity, description, affectedPeople } = req.body;
    const db = getDB();
    await db.execute(
      'UPDATE hazards SET status=?,severity=?,description=?,affected_people=? WHERE id=?',
      [status, severity, description, affectedPeople || 0, req.params.id]
    );
    const [rows] = await db.execute('SELECT * FROM hazards WHERE id=?', [req.params.id]);
    res.json({ success: true, data: rows[0] });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};

// DELETE /api/hazards/:id  (admin)
exports.deleteHazard = async (req, res) => {
  try {
    const db = getDB();
    await db.execute('DELETE FROM hazards WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Hazard deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
