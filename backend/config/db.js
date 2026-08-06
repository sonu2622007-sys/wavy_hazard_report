// config/db.js — MySQL with all tables including admin
const mysql = require('mysql2/promise');

let pool;

const connectDB = async () => {
  try {
    pool = mysql.createPool({
      host:     process.env.DB_HOST     || 'localhost',
      port:     process.env.DB_PORT     || 3306,
      user:     process.env.DB_USER     || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME     || 'wavy_db',
      waitForConnections: true,
      connectionLimit: 10,
    });
    const conn = await pool.getConnection();
    console.log(`✅ MySQL Connected: ${process.env.DB_HOST || 'localhost'}`);
    conn.release();
    await createTables();
    console.log('✅ All tables ready');
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    console.log('\n📌 Fix: Open MySQL Workbench → run: CREATE DATABASE wavy_db;');
    console.log('📌 Then set DB_PASSWORD in backend/.env\n');
    process.exit(1);
  }
};

const createTables = async () => {
  // Users
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      name          VARCHAR(100) NOT NULL,
      email         VARCHAR(150) NOT NULL UNIQUE,
      password      VARCHAR(255) NOT NULL,
      role          ENUM('user','admin','authority') DEFAULT 'user',
      location      VARCHAR(150) DEFAULT 'Chennai, Tamil Nadu',
      alert_pref    ENUM('all','critical','cyclone') DEFAULT 'all',
      notify_method ENUM('email_sms','email','sms') DEFAULT 'email_sms',
      is_active     TINYINT(1) DEFAULT 1,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Hazards
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS hazards (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      type            ENUM('Cyclone','Oil Spill','Flooding','Tsunami','Waterspout','Marine Pollution','Storm') NOT NULL,
      name            VARCHAR(150) NOT NULL,
      severity        ENUM('monitor','warning','critical') NOT NULL,
      location_desc   VARCHAR(255) NOT NULL,
      lat             DECIMAL(9,6) DEFAULT NULL,
      lng             DECIMAL(9,6) DEFAULT NULL,
      description     TEXT,
      wind_speed      DECIMAL(6,2) DEFAULT NULL,
      wave_height     DECIMAL(5,2) DEFAULT NULL,
      pressure        DECIMAL(7,2) DEFAULT NULL,
      affected_people INT DEFAULT 0,
      status          ENUM('active','resolved','monitoring') DEFAULT 'active',
      reported_by     INT DEFAULT NULL,
      source          ENUM('user','imd','isro','system') DEFAULT 'user',
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Donations
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS donations (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      donor_name VARCHAR(100) NOT NULL,
      email      VARCHAR(150) DEFAULT '',
      amount     DECIMAL(10,2) NOT NULL,
      cause      ENUM('Cyclone Relief','Oil Spill Cleanup','Flood Recovery','Fisher Community Aid') NOT NULL,
      user_id    INT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Alert logs (track emails sent)
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS alert_logs (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      hazard_id  INT DEFAULT NULL,
      user_id    INT DEFAULT NULL,
      email      VARCHAR(150),
      type       ENUM('new_hazard','status_update','evacuation') DEFAULT 'new_hazard',
      sent_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hazard_id) REFERENCES hazards(id) ON DELETE SET NULL,
      FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE SET NULL
    )
  `);

  // Seed sample data
  const [rows] = await pool.execute('SELECT COUNT(*) AS cnt FROM hazards');
  if (rows[0].cnt === 0) {
    await pool.execute(`
      INSERT INTO hazards (type,name,severity,location_desc,lat,lng,description,wind_speed,wave_height,affected_people,status,source) VALUES
      ('Cyclone','Cyclone DANA','critical','Bay of Bengal, 200km off coast',13.5,82.0,'Severe cyclonic storm approaching landfall',180,3.5,50000,'active','imd'),
      ('Oil Spill','Oil Spill Block 7','warning','Gulf of Mannar',8.5,78.5,'Oil spill from cargo vessel, containment active',NULL,NULL,0,'active','isro'),
      ('Storm','Storm System S-04','monitor','Arabian Sea, NW sector',18.5,71.0,'Forming storm system under observation',NULL,2.0,0,'monitoring','imd'),
      ('Flooding','Coastal Flood Z3','warning','South Tamil Nadu Coast',6.5,81.5,'Coastal flooding in 5 districts',NULL,NULL,12000,'active','system'),
      ('Storm','Storm System S-07','monitor','Arabian Sea, North',22.0,69.5,'Forming low-pressure system',NULL,1.5,0,'monitoring','imd')
    `);
    console.log('✅ Sample hazards seeded');
  }

  // Seed default admin (password: Admin@123)
  const bcrypt = require('bcryptjs');
  const [admins] = await pool.execute("SELECT id FROM users WHERE role='admin'");
  if (admins.length === 0) {
    const hashed = await bcrypt.hash('Admin@123', 12);
    await pool.execute(
      "INSERT INTO users (name,email,password,role) VALUES ('Admin','admin@wavy.ocean',?,'admin')",
      [hashed]
    );
    console.log("✅ Admin seeded — email: admin@wavy.ocean | password: Admin@123");
  }
};

const getDB = () => pool;
module.exports = { connectDB, getDB };
