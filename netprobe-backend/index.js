const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Security HTTP headers
app.use(helmet());

// Global Rate Limiting: max 100 requests per 15 minutes per IP on /api routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});

// Allow CORS only for your portfolio and local development
const allowedOrigins = ['https://sambit.page', 'http://localhost:5500', 'http://127.0.0.1:5500'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  }
}));

app.use(express.json());

// Initialize Firebase Admin (uses GOOGLE_APPLICATION_CREDENTIALS or default credentials in GCP/production)
if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (err) {
    console.warn('Firebase Admin initialization warning:', err.message);
  }
}

// Token Verification Middleware: enforces authenticated access on all /api routes
async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: Missing or invalid Authorization header. Provide a valid Firebase ID token in "Bearer <token>" format.'
    });
  }

  const token = authHeader.split('Bearer ')[1].trim();
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Firebase ID token verification failed:', error.message);
    return res.status(401).json({
      error: 'Unauthorized: Invalid or expired Firebase ID token.',
      code: error.code || 'auth/invalid-token'
    });
  }
}

// Target validator: letters, numbers, hyphens, dots
const isValidTarget = (val) => typeof val === 'string' && /^[a-zA-Z0-9.-]+$/.test(val.trim());
// IP validator: IPv4 or IPv6
const isValidIp = (val) => typeof val === 'string' && /^[a-fA-F0-9.:-]+$/.test(val.trim());

// Basic health check (public, not behind /api)
app.get('/', (req, res) => {
  res.json({ status: 'NetProbe Backend Online', version: '1.0' });
});

// Apply rate limiter and token authentication to all /api routes
app.use('/api', apiLimiter, verifyFirebaseToken);

// ── NMAP ENDPOINT ──
// Queries HackerTarget Nmap API
app.post('/api/scan/nmap', async (req, res) => {
  const { target } = req.body;

  if (!isValidTarget(target)) {
    return res.status(400).json({ error: 'Invalid target format. Only alphanumeric hostnames/IPs are permitted.' });
  }

  try {
    const cleanTarget = target.trim();
    const url = `https://api.hackertarget.com/nmap/?q=${encodeURIComponent(cleanTarget)}`;
    const response = await fetch(url);
    const text = await response.text();
    
    // Parse the stdout to extract open ports
    const lines = text.split('\n');
    const openPorts = [];
    
    lines.forEach(line => {
      if (line.includes('open')) {
        const parts = line.split(/\s+/);
        if (parts.length >= 3) {
          openPorts.push({
            port: parts[0],
            state: parts[1],
            service: parts[2]
          });
        }
      }
    });

    res.json({
      target: cleanTarget,
      rawOutput: text,
      openPorts: openPorts
    });
  } catch (error) {
    console.error('Nmap Fetch Error:', error);
    res.status(500).json({ error: 'Nmap scan failed', details: error.message });
  }
});

// ── PROXY ENDPOINTS ──

// Headers
app.get('/api/scan/headers', async (req, res) => {
  const { target } = req.query;
  if (!isValidTarget(target)) {
    return res.status(400).json({ error: 'Invalid target domain or IP.' });
  }

  try {
    const cleanTarget = target.trim();
    const hdrsUrl = encodeURIComponent(`https://api.hackertarget.com/httpheaders/?q=${cleanTarget}`);
    const response = await fetch(`https://api.codetabs.com/v1/proxy/?quest=${hdrsUrl}`);
    const text = await response.text();
    res.send(text);
  } catch (error) {
    res.status(500).json({ error: 'Headers fetch failed' });
  }
});

// Shodan
app.get('/api/scan/shodan', async (req, res) => {
  const { ip } = req.query;
  // Key is strictly read from server environment variable, never accepted from query string
  const key = process.env.SHODAN_KEY;

  if (!key) {
    return res.status(500).json({ error: 'Shodan API key is not configured on the server (set SHODAN_KEY in environment).' });
  }

  if (!isValidIp(ip)) {
    return res.status(400).json({ error: 'Invalid IP address format.' });
  }

  try {
    const cleanIp = ip.trim();
    const response = await fetch(`https://api.shodan.io/shodan/host/${encodeURIComponent(cleanIp)}?key=${encodeURIComponent(key)}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Shodan fetch failed' });
  }
});

app.listen(PORT, () => {
  console.log(`NetProbe Backend running on port ${PORT}`);
});
