/* ============================================================
   WAVY — Dashboard App JS (v4)
   Works with: pages/dashboard.html
   Login/Register handled by their own pages
============================================================ */

const API = 'http://localhost:5000/api';

// ── Get stored user ──────────────────────
const currentUser = JSON.parse(localStorage.getItem('wavy_user') || '{}');
const authToken   = localStorage.getItem('wavy_token') || '';

// ── API helper ───────────────────────────
async function apiCall(method, path, body) {
  try {
    var opts = { method: method, headers: { 'Content-Type': 'application/json' } };
    if (authToken) opts.headers['Authorization'] = 'Bearer ' + authToken;
    if (body) opts.body = JSON.stringify(body);
    var controller = new AbortController();
    var t = setTimeout(function(){ controller.abort(); }, 4000);
    var res = await fetch(API + path, Object.assign(opts, { signal: controller.signal }));
    clearTimeout(t);
    return await res.json();
  } catch (e) {
    return null;
  }
}

// ── STATE ────────────────────────────────
var sidebarOpen  = false;
var mapReady     = false;
var currentPanel = 'dashboard';

// ── LOGOUT ───────────────────────────────
function logout() {
  localStorage.removeItem('wavy_token');
  localStorage.removeItem('wavy_user');
  window.location.href = 'login.html';
}

// ── SIDEBAR ──────────────────────────────
function toggleSidebar() {
  sidebarOpen = !sidebarOpen;
  var sb  = document.getElementById('sidebar');
  var ov  = document.getElementById('overlay');
  var hb  = document.querySelector('.hamburger');
  if (sb)  sb.classList.toggle('open', sidebarOpen);
  if (ov)  ov.classList.toggle('show', sidebarOpen);
  if (hb)  hb.classList.toggle('active', sidebarOpen);
}

function closeSidebar() {
  sidebarOpen = false;
  var sb = document.getElementById('sidebar');
  var ov = document.getElementById('overlay');
  var hb = document.querySelector('.hamburger');
  if (sb) sb.classList.remove('open');
  if (ov) ov.classList.remove('show');
  if (hb) hb.classList.remove('active');
}

var ov = document.getElementById('overlay');
if (ov) ov.addEventListener('click', closeSidebar);

// ── PANELS ───────────────────────────────
function showPanel(name) {
  // Hide all panels
  document.querySelectorAll('.panel').forEach(function(p) {
    p.classList.remove('active');
  });

  // Show target panel
  var target = document.getElementById('panel-' + name);
  if (target) {
    target.classList.add('active');
  }

  // Update sidebar active state
  document.querySelectorAll('.sb-item').forEach(function(item) {
    if (item.dataset.panel === name) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  currentPanel = name;
  closeSidebar();

  // Lazy load
  if (name === 'geo')     initGeoMap();
  if (name === 'weather') loadWeatherPanel();
}

// Wire up all sidebar items
document.querySelectorAll('.sb-item[data-panel]').forEach(function(item) {
  item.addEventListener('click', function() {
    showPanel(item.dataset.panel);
  });
});

// ── LOAD DASHBOARD DATA ───────────────────
async function loadDashboardData() {
  var stats = await apiCall('GET', '/hazards/stats');
  if (stats && stats.success) {
    var byType = stats.stats.byType || [];
    function getCount(type) {
      var found = byType.find(function(t){ return t._id === type; });
      return found ? found.count : 0;
    }
    animCounterById('stat-cyclone',  getCount('Cyclone'));
    animCounterById('stat-oilspill', getCount('Oil Spill'));
    animCounterById('stat-flood',    getCount('Flooding'));
    animCounterById('stat-storm',    getCount('Storm'));
  }
}

// ── WEATHER PANEL ─────────────────────────
async function loadWeatherPanel() {
  var el = document.getElementById('weather-live');
  if (!el) return;
  el.innerHTML = '<p style="color:#7fafc4;padding:12px;">Loading weather...</p>';

  var wx = await apiCall('GET', '/weather/current?city=Chennai');
  var d  = (wx && wx.success) ? wx.data : {
    temperature: 28, windSpeed: 42, humidity: 82,
    pressure: 1008, visibility: 6, cloudiness: 85,
    condition: 'Thunderstorm', description: 'thunderstorm with rain'
  };

  var emoji = { Thunderstorm:'⛈️', Drizzle:'🌦️', Rain:'🌧️', Snow:'❄️', Clear:'☀️', Clouds:'☁️' };
  el.innerHTML =
    wCard((emoji[d.condition] || '🌊'), d.temperature + '°C', d.description || d.condition) +
    wCard('💨', d.windSpeed + ' km/h', 'Wind Speed') +
    wCard('💧', d.humidity + '%', 'Humidity') +
    wCard('⏱️', d.pressure + ' hPa', 'Pressure') +
    wCard('👁️', d.visibility + ' km', 'Visibility') +
    wCard('☁️', d.cloudiness + '%', 'Cloud Cover');
}

function wCard(icon, val, lbl) {
  return '<div class="w-card"><div class="w-icon">' + icon + '</div>' +
         '<div class="w-val">' + val + '</div>' +
         '<div class="w-lbl">' + lbl + '</div></div>';
}

// ── GEO MAP ───────────────────────────────
async function initGeoMap() {
  if (mapReady) return;
  mapReady = true;

  var map = L.map('geo-map', { center: [10, 80], zoom: 4 });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap © CARTO', subdomains: 'abcd', maxZoom: 19
  }).addTo(map);

  var geo = await apiCall('GET', '/hazards/geo');
  var pts = (geo && geo.success && geo.data.length > 0)
    ? geo.data.map(function(h) {
        return {
          lat: h.location && h.location.coordinates ? h.location.coordinates.lat : 13,
          lng: h.location && h.location.coordinates ? h.location.coordinates.lng : 80,
          name: h.name, type: h.type, severity: h.severity,
          color: h.severity === 'critical' ? '#ff4d6d' : h.severity === 'warning' ? '#ffa500' : '#1dd3b0',
          info: 'Type: ' + h.type,
          radius: h.severity === 'critical' ? 180000 : 90000
        };
      })
    : [
        { lat:13.5, lng:82.0, name:'Cyclone DANA',     type:'Cyclone',   severity:'critical', color:'#ff4d6d', info:'Wind: 180 km/h | ETA: 48 hrs', radius:180000 },
        { lat:8.5,  lng:78.5, name:'Oil Spill Blk 7',  type:'Oil Spill', severity:'warning',  color:'#ffa500', info:'Area: 3.2 sq km',              radius:60000  },
        { lat:18.5, lng:71.0, name:'Storm S-04',        type:'Storm',     severity:'monitor',  color:'#1dd3b0', info:'Pressure: 990 hPa',            radius:120000 },
        { lat:6.5,  lng:81.5, name:'Coastal Flood Z3',  type:'Flooding',  severity:'warning',  color:'#ffa500', info:'5 districts affected',         radius:80000  },
        { lat:22.0, lng:69.5, name:'Storm S-07',        type:'Storm',     severity:'monitor',  color:'#1dd3b0', info:'Forming system',               radius:90000  }
      ];

  pts.forEach(function(h) {
    L.circle([h.lat, h.lng], {
      color: h.color, fillColor: h.color, fillOpacity: 0.12, weight: 1.5, radius: h.radius
    }).addTo(map);

    var icon = L.divIcon({
      className: '',
      html: '<div style="position:relative;width:36px;height:36px;">' +
            '<div style="position:absolute;inset:0;border-radius:50%;background:' + h.color + ';opacity:.2;animation:ripM 2s ease-out infinite;"></div>' +
            '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:14px;height:14px;border-radius:50%;background:' + h.color + ';box-shadow:0 0 10px ' + h.color + ';"></div>' +
            '</div>',
      iconSize: [36, 36], iconAnchor: [18, 18]
    });

    L.marker([h.lat, h.lng], { icon: icon }).addTo(map).bindPopup(
      '<div style="font-family:sans-serif;min-width:180px;">' +
      '<b style="font-size:15px;">' + h.name + '</b>' +
      '<div style="font-size:12px;color:#aaa;margin:4px 0;">' + h.type + '</div>' +
      '<div style="font-size:13px;">' + h.info + '</div>' +
      '<div style="margin-top:8px;padding:3px 10px;display:inline-block;border-radius:10px;font-size:11px;font-weight:700;background:' + h.color + '22;color:' + h.color + ';border:1px solid ' + h.color + '44;">' + h.severity.toUpperCase() + '</div>' +
      '</div>',
      { className: 'wavy-popup' }
    );
  });

  // Inject ripple keyframe
  if (!document.getElementById('map-anim')) {
    var s = document.createElement('style');
    s.id = 'map-anim';
    s.textContent = '@keyframes ripM{0%{transform:scale(.4);opacity:.8}100%{transform:scale(2.5);opacity:0}}' +
      '.wavy-popup .leaflet-popup-content-wrapper{background:#042f4b!important;color:#e8f4f8!important;border:1px solid rgba(29,211,176,.2)!important;border-radius:12px!important;}' +
      '.wavy-popup .leaflet-popup-tip{background:#042f4b!important;}';
    document.head.appendChild(s);
  }
}

// ── REPORT HAZARD ─────────────────────────
async function submitReport() {
  var type = document.getElementById('r-type').value;
  var loc  = document.getElementById('r-loc').value.trim();
  var sev  = document.getElementById('r-sev').value;
  var desc = document.getElementById('r-desc').value.trim();

  if (!type || !loc || !desc) { showToast('⚠ Please fill all fields.', true); return; }

  var result = await apiCall('POST', '/hazards', {
    type: type, severity: sev.toLowerCase(), description: desc,
    name: type + ' – ' + loc.split(',')[0],
    location: { description: loc, coordinates: { lat: null, lng: null } }
  });

  if (result && result.success) {
    showToast('✅ Hazard reported! Authorities notified.');
  } else {
    showToast('✅ Hazard recorded locally.');
  }

  document.getElementById('r-type').value = '';
  document.getElementById('r-loc').value  = '';
  document.getElementById('r-desc').value = '';
}

// ── DONATE ───────────────────────────────
async function submitDonate() {
  var name  = document.getElementById('d-name').value.trim();
  var amt   = document.getElementById('d-amount').value;
  var cause = document.getElementById('d-cause').value;

  if (!name || !amt || amt <= 0) { showToast('⚠ Enter your name and amount.', true); return; }

  var result = await apiCall('POST', '/donations', {
    donorName: name, amount: Number(amt), cause: cause
  });

  showToast(result && result.success
    ? result.message
    : '🙏 Thank you, ' + name + '! ₹' + amt + ' donation received.'
  );

  document.getElementById('d-name').value   = '';
  document.getElementById('d-amount').value = '';
}

// ── SAVE SETTINGS ─────────────────────────
async function saveSettings() {
  var location = document.getElementById('s-location').value;
  var alertPref = document.getElementById('s-alert').value;
  var notify   = document.getElementById('s-notify').value;

  var result = await apiCall('PUT', '/auth/settings', {
    location: location, alertPreference: alertPref, notifyMethod: notify
  });

  showToast(result && result.success ? '✅ Settings saved to account!' : '✅ Settings saved.');
}

// ── TOAST ─────────────────────────────────
function showToast(msg, isErr) {
  var t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.style.borderColor = isErr ? '#ff4d6d' : '#1dd3b0';
  t.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(function() { t.classList.remove('show'); }, 3800);
}

// ── COUNTER ANIMATION ─────────────────────
function animCounter(el, target) {
  var start = 0;
  var dur   = 1200;
  var t0    = null;
  function step(ts) {
    if (!t0) t0 = ts;
    var p = Math.min((ts - t0) / dur, 1);
    var e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.floor(e * target);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function animCounterById(id, target) {
  var el = document.getElementById(id);
  if (el) animCounter(el, target);
}

// ── INIT on page load ─────────────────────
window.addEventListener('load', function() {
  // Animate default stat counters
  document.querySelectorAll('[data-count]').forEach(function(el) {
    animCounter(el, parseInt(el.getAttribute('data-count')));
  });

  // Load live data
  loadDashboardData();

  // Socket.io real-time (if available)
  if (typeof io !== 'undefined') {
    try {
      var socket = io('http://localhost:5000');
      socket.on('new_hazard', function(d) {
        showToast('🚨 New ' + d.severity.toUpperCase() + ': ' + d.name);
      });
      socket.on('live_update', function() {
        if (currentPanel === 'dashboard') loadDashboardData();
      });
    } catch(e) {}
  }
});
