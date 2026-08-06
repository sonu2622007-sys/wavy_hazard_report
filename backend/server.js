// server.js — Wavy v4 (MySQL + Email + Admin + Socket.io)
require('dotenv').config();

const express    = require('express');
const http       = require('http');
const cors       = require('cors');
const { Server } = require('socket.io');
const cron       = require('node-cron');
const { connectDB } = require('./config/db');

const authRoutes     = require('./routes/authRoutes');
const hazardRoutes   = require('./routes/hazardRoutes');
const weatherRoutes  = require('./routes/weatherRoutes');
const donationRoutes = require('./routes/donationRoutes');
const adminRoutes    = require('./routes/adminRoutes');

connectDB();

const app    = express();
const server = http.createServer(app);

// Socket.io
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://127.0.0.1:5500', methods: ['GET','POST'] }
});
app.set('io', io);
io.on('connection', socket => {
  console.log(`🔌 Client: ${socket.id}`);
  socket.emit('server_message', { message: '🌊 Wavy real-time connected' });
  socket.on('disconnect', () => console.log(`🔌 Off: ${socket.id}`));
});

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://127.0.0.1:5500' }));
app.use(express.json());
app.use((req, _res, next) => { console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`); next(); });

// Routes
app.use('/api/auth',      authRoutes);
app.use('/api/hazards',   hazardRoutes);
app.use('/api/weather',   weatherRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/admin',     adminRoutes);      // ← NEW admin routes

// Health check
app.get('/api/health', (_req, res) =>
  res.json({ success: true, status: '🌊 Wavy v4 running', db: 'MySQL', time: new Date() })
);

app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use((err, _req, res, _next) => res.status(500).json({ success: false, message: err.message }));

// Heartbeat every 30s
cron.schedule('*/30 * * * * *', () => {
  io.emit('live_update', { type: 'heartbeat', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log('');
  console.log('🌊 ══════════════════════════════════════════');
  console.log(`   Wavy v4 Backend — port ${PORT}`);
  console.log(`   Health:  http://localhost:${PORT}/api/health`);
  console.log(`   Admin:   POST /api/auth/login (admin@wavy.ocean / Admin@123)`);
  console.log(`   DB:      ${process.env.DB_NAME}@${process.env.DB_HOST}`);
  console.log(`   Email:   ${process.env.EMAIL_USER || 'not configured'}`);
  console.log('🌊 ══════════════════════════════════════════');
  console.log('');
});
