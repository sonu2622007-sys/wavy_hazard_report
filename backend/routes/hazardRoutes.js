// routes/hazardRoutes.js
const express = require('express');
const router  = express.Router();
const {
  getHazards, getHazard, createHazard,
  updateHazard, deleteHazard, getStats, getGeoData,
} = require('../controllers/hazardController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/stats',        getStats);           // public — dashboard summary
router.get('/geo',          getGeoData);         // public — map pins
router.get('/',             getHazards);         // public — list
router.get('/:id',          getHazard);          // public — single
router.post('/',   protect, createHazard);       // user must be logged in
router.put('/:id', protect, adminOnly, updateHazard);   // admin only
router.delete('/:id', protect, adminOnly, deleteHazard); // admin only

module.exports = router;
