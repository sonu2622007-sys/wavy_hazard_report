// routes/donationRoutes.js
const express = require('express');
const router  = express.Router();
const { createDonation, getDonationStats } = require('../controllers/donationController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/',       protect, createDonation);
router.get('/stats',   protect, adminOnly, getDonationStats);

module.exports = router;
