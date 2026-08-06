// controllers/weatherController.js
const axios = require('axios');

const API_KEY = process.env.WEATHER_API_KEY;
const BASE    = 'https://api.openweathermap.org/data/2.5';

// Ocean monitoring cities along Indian coast
const COASTAL_CITIES = [
  { name: 'Chennai',        lat: 13.0827, lon: 80.2707 },
  { name: 'Visakhapatnam', lat: 17.6868, lon: 83.2185 },
  { name: 'Mumbai',        lat: 19.0760, lon: 72.8777 },
  { name: 'Kochi',         lat:  9.9312, lon: 76.2673 },
  { name: 'Kolkata',       lat: 22.5726, lon: 88.3639 },
];

// ── CURRENT WEATHER for a city ────────────
// GET /api/weather/current?city=Chennai
exports.getCurrent = async (req, res) => {
  try {
    const city = req.query.city || 'Chennai';

    if (!API_KEY || API_KEY === 'your_openweathermap_api_key_here') {
      // Return mock data when no API key is set
      return res.status(200).json({
        success: true,
        mock: true,
        data: getMockWeather(city),
      });
    }

    const { data } = await axios.get(`${BASE}/weather`, {
      params: { q: city, appid: API_KEY, units: 'metric' },
    });

    res.status(200).json({
      success: true,
      data: {
        city:        data.name,
        country:     data.sys.country,
        temperature: data.main.temp,
        feelsLike:   data.main.feels_like,
        humidity:    data.main.humidity,
        pressure:    data.main.pressure,
        windSpeed:   (data.wind.speed * 3.6).toFixed(1),   // m/s → km/h
        windDir:     data.wind.deg,
        visibility:  (data.visibility / 1000).toFixed(1),  // m → km
        condition:   data.weather[0].main,
        description: data.weather[0].description,
        icon:        `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
        cloudiness:  data.clouds.all,
        sunrise:     new Date(data.sys.sunrise * 1000).toLocaleTimeString(),
        sunset:      new Date(data.sys.sunset  * 1000).toLocaleTimeString(),
        timestamp:   new Date(),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── 5-DAY FORECAST ────────────────────────
// GET /api/weather/forecast?city=Chennai
exports.getForecast = async (req, res) => {
  try {
    const city = req.query.city || 'Chennai';

    if (!API_KEY || API_KEY === 'your_openweathermap_api_key_here') {
      return res.status(200).json({ success: true, mock: true, data: getMockForecast(city) });
    }

    const { data } = await axios.get(`${BASE}/forecast`, {
      params: { q: city, appid: API_KEY, units: 'metric', cnt: 24 },
    });

    // Group by day
    const byDay = {};
    data.list.forEach(item => {
      const day = item.dt_txt.split(' ')[0];
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push({
        time:        item.dt_txt.split(' ')[1],
        temp:        item.main.temp,
        humidity:    item.main.humidity,
        windSpeed:   (item.wind.speed * 3.6).toFixed(1),
        condition:   item.weather[0].main,
        description: item.weather[0].description,
        icon:        `https://openweathermap.org/img/wn/${item.weather[0].icon}.png`,
        rain:        item.rain ? item.rain['3h'] : 0,
      });
    });

    res.status(200).json({ success: true, city, data: byDay });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── ALL COASTAL CITIES WEATHER ────────────
// GET /api/weather/coastal
exports.getCoastalWeather = async (req, res) => {
  try {
    if (!API_KEY || API_KEY === 'your_openweathermap_api_key_here') {
      return res.status(200).json({
        success: true, mock: true,
        data: COASTAL_CITIES.map(c => getMockWeather(c.name)),
      });
    }

    const results = await Promise.all(
      COASTAL_CITIES.map(c =>
        axios.get(`${BASE}/weather`, {
          params: { lat: c.lat, lon: c.lon, appid: API_KEY, units: 'metric' },
        }).then(r => ({
          city:        r.data.name,
          temperature: r.data.main.temp,
          humidity:    r.data.main.humidity,
          windSpeed:   (r.data.wind.speed * 3.6).toFixed(1),
          condition:   r.data.weather[0].main,
          description: r.data.weather[0].description,
        })).catch(() => ({ city: c.name, error: true }))
      )
    );

    res.status(200).json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── MOCK DATA (used when no API key) ──────
function getMockWeather(city) {
  return {
    city,
    temperature: 28,
    feelsLike:   31,
    humidity:    82,
    pressure:    1008,
    windSpeed:   42,
    windDir:     45,
    visibility:  6.2,
    condition:   'Thunderstorm',
    description: 'thunderstorm with heavy rain',
    cloudiness:  85,
    sunrise:     '06:12 AM',
    sunset:      '06:28 PM',
    timestamp:   new Date(),
    mock: true,
  };
}

function getMockForecast(city) {
  const today = new Date();
  return {
    [today.toISOString().split('T')[0]]: [
      { time: '06:00', temp: 26, humidity: 88, windSpeed: 38, condition: 'Rain',          rain: 12 },
      { time: '12:00', temp: 30, humidity: 80, windSpeed: 45, condition: 'Thunderstorm',  rain: 22 },
      { time: '18:00', temp: 28, humidity: 84, windSpeed: 50, condition: 'Thunderstorm',  rain: 18 },
    ],
  };
}
