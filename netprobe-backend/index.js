const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

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

// Target validator: letters, numbers, hyphens, dots
const isValidTarget = (val) => typeof val === 'string' && /^[a-zA-Z0-9.-]+$/.test(val.trim());
// IP validator: IPv4 or IPv6
const isValidIp = (val) => typeof val === 'string' && /^[a-fA-F0-9.:-]+$/.test(val.trim());

// Basic health check
app.get('/', (req, res) => {
  res.json({ status: 'NetProbe Backend Online', version: '1.0' });
});

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
  const key = process.env.SHODAN_KEY || req.query.key;

  if (!key) {
    return res.status(400).json({ error: 'Shodan API key is required (set SHODAN_KEY in environment or supply key parameter).' });
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
