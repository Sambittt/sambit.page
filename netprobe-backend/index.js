const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// Allow CORS only for your portfolio and local development
const allowedOrigins = ['https://sambit.page', 'http://localhost:5500', 'http://127.0.0.1:5500'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json());

// Basic health check
app.get('/', (req, res) => {
  res.json({ status: 'NetProbe Backend Online', version: '1.0' });
});

// ── NMAP ENDPOINT ──
// Uses HackerTarget Nmap API so this backend can be hosted ANYWHERE (no local nmap required)
app.post('/api/scan/nmap', async (req, res) => {
  const { target } = req.body;

  if (!target || !/^[a-zA-Z0-9.-]+$/.test(target)) {
    return res.status(400).json({ error: 'Invalid target format.' });
  }

  try {
    const url = `https://api.hackertarget.com/nmap/?q=${target}`;
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
      target: target,
      rawOutput: text,
      openPorts: openPorts
    });
  } catch (error) {
    console.error('Nmap Fetch Error:', error);
    res.status(500).json({ error: 'Nmap scan failed', details: error.message });
  }
});

// ── PROXY ENDPOINTS (Moving frontend logic to backend) ──

// Headers
app.get('/api/scan/headers', async (req, res) => {
  const { target } = req.query;
  try {
    const hdrsUrl = encodeURIComponent(`https://api.hackertarget.com/httpheaders/?q=${target}`);
    const response = await fetch(`https://api.codetabs.com/v1/proxy/?quest=${hdrsUrl}`);
    const text = await response.text();
    res.send(text);
  } catch (error) {
    res.status(500).json({ error: 'Headers fetch failed' });
  }
});

// Shodan
app.get('/api/scan/shodan', async (req, res) => {
  const { ip, key } = req.query;
  try {
    // You should hardcode your SHODAN_KEY here instead of passing from frontend
    // const SHODAN_KEY = process.env.SHODAN_KEY || 'your_key';
    const response = await fetch(`https://api.shodan.io/shodan/host/${ip}?key=${key}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Shodan fetch failed' });
  }
});

app.listen(PORT, () => {
  console.log(`NetProbe Backend running on port ${PORT}`);
});
