// routes/weatherRoutes.js
const express = require('express');
const router  = express.Router();
const { getCurrent, getForecast, getCoastalWeather } = require('../controllers/weatherController');

router.get('/current',  getCurrent);
router.get('/forecast', getForecast);
router.get('/coastal',  getCoastalWeather);

module.exports = router;
