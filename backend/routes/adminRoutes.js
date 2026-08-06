// routes/adminRoutes.js
const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getSummary, getUsers, updateUser, deleteUser,
  getAllHazards, getAllDonations, getAlertLogs, resolveHazard,
} = require('../controllers/adminController');

// All admin routes require: logged in + admin role
router.use(protect, adminOnly);

router.get('/summary',            getSummary);
router.get('/users',              getUsers);
router.put('/users/:id',          updateUser);
router.delete('/users/:id',       deleteUser);
router.get('/hazards',            getAllHazards);
router.put('/hazards/:id/resolve',resolveHazard);
router.get('/donations',          getAllDonations);
router.get('/alerts',             getAlertLogs);

module.exports = router;
