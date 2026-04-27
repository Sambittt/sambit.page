// Portfolio AI Agent — Powered by Pollinations AI (no API key needed)
const API_URL = 'https://text.pollinations.ai/';
const COOLDOWN_MS = 2000;
let lastSentAt = 0;

// System prompt
const SYSTEM_PROMPT = `You are the AI assistant embedded in Sambit Satapathy's personal portfolio website (sambit.page).
Your personality: friendly, concise, slightly "dark terminal / hacker" vibe — but always professional.

About Sambit:
- BCA student specialising in Cybersecurity, Ethical Hacking, Linux & Network Defence
- Actively seeking internships in Cybersecurity or Development
- Contact: GitHub (Sambittt) | Instagram (@sambit.satapathy_) | Email: sambitsatapathy00@gmail.com

Skills:
- Linux System Administration (Advanced)
- Network Security & Defence (Intermediate)
- Python & Bash Scripting (Intermediate)
- Web Development — HTML/CSS/JS, Firebase

Projects:
1. NetProbe — Browser-based SOC & OSINT scanner. DNS/WHOIS, Shodan CVE, Risk Scoring, PDF reports. Requires login.
2. ASCII Studio — Converts images, videos & GIFs into ASCII art. Free, no login needed.
3. Resume Builder — Dark-themed resume maker with 3 templates, export to PDF/PNG. Login required.
4. Font Animator — Cyberpunk-style text animation studio, export HTML/CSS/JSON. Free, no login needed.
5. This Portfolio — Pure HTML/CSS/JS, no frameworks, deployed on GitHub Pages at sambit.page.

Other details:
- All tools are 100% free and built without React/Next.js.
- UPI for coffee/donations: sambit22@upi

Rules:
- Answer only what is asked. Be concise (max 3-4 sentences unless a list is needed).
- Use **bold** for emphasis. Use newlines to separate points.
- Never make up information. If unsure, say so politely.
- If asked about a specific tool URL, explain that tool.`;

// Suggestion chips
const SUGGESTIONS = [
  'What is this site?',
  'Who is Sambit?',
  'What are his skills?',
  'Show me the projects',
  'How can I contact Sambit?',
  'Are these tools free?',
  'Any internship openings?',
  'Can I buy Sambit a coffee?'
];

// Multi-turn history (OpenAI format)
let chatHistory = [];
let currentUserName = null;

// ── Init ───────────────────────────────────────────────────────────────────
function initChatbot() {

  // ── Inject HTML ────────────────────────────────────────────────────────
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <button class="ai-fab" id="ai-fab" aria-label="Open AI chat">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </button>

    <div class="ai-window" id="ai-window">
      <div class="ai-header">
        <div class="ai-title">// SAMBIT_AI</div>
        <button class="ai-close" id="ai-close" aria-label="Close">✕</button>
      </div>
      <div class="ai-body" id="ai-body">
        <div class="ai-msg bot" id="ai-greeting">Hello! I'm Sambit's AI assistant. Ask me anything about him or the tools on this site!</div>
      </div>
      <div class="ai-options" id="ai-options">
        ${SUGGESTIONS.map(q => `<div class="ai-chip" role="button" tabindex="0">${q}</div>`).join('')}
      </div>
      <div class="ai-input-area">
        <input type="text" class="ai-input" id="ai-input" placeholder="Ask anything..." autocomplete="off" maxlength="400">
        <button class="ai-send" id="ai-send" aria-label="Send">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>`;
  document.body.appendChild(wrap);

  // ── Elements ───────────────────────────────────────────────────────────
  const fab      = document.getElementById('ai-fab');
  const win      = document.getElementById('ai-window');
  const closeBtn = document.getElementById('ai-close');
  const input    = document.getElementById('ai-input');
  const sendBtn  = document.getElementById('ai-send');
  const msgBody  = document.getElementById('ai-body');
  const chips    = document.querySelectorAll('.ai-chip');
  const greeting = document.getElementById('ai-greeting');

  // ── Personalise greeting from Firebase auth ────────────────────────────
  try {
    // Firebase auth is already loaded on the page; just observe it
    const existingApp = window._fbApp || null;
    if (existingApp) {
      const { getAuth, onAuthStateChanged } =
        window.firebaseAuth || {};
      // Fallback: read displayName from sessionStorage set by the main script
    }
    // Simple fallback: read from sessionStorage if main page set it
    const storedName = sessionStorage.getItem('ai_user_name');
    if (storedName) {
      currentUserName = storedName;
      greeting.innerHTML = `Hey <b>${storedName}</b>! I'm Sambit's AI assistant. Ask me anything about him or the tools here.`;
    }
  } catch (_) {}

  // ── Open / Close (FAB click bug fixed: use .contains()) ───────────────
  fab.addEventListener('click', (e) => {
    e.stopPropagation();          // prevent document listener from closing immediately
    win.classList.toggle('open');
    if (win.classList.contains('open')) input.focus();
  });

  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    win.classList.remove('open');
  });

  document.addEventListener('click', (e) => {
    // Only close if the click was truly outside both the window AND the FAB
    if (win.classList.contains('open') &&
        !win.contains(e.target) &&
        !fab.contains(e.target)) {          // ← fix: contains() not ===
      win.classList.remove('open');
    }
  });

  // ── Scroll ─────────────────────────────────────────────────────────────
  const scrollToBottom = () => { msgBody.scrollTop = msgBody.scrollHeight; };

  // ── Append message ─────────────────────────────────────────────────────
  function appendMessage(text, sender, isMarkdown = false) {
    const el = document.createElement('div');
    el.className = `ai-msg ${sender}`;

    if (isMarkdown) {
      let html = text
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>')
        .replace(/\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g,
          '<a href="$2" target="_blank" rel="noopener">$1</a>');
      el.innerHTML = html;
    } else {
      el.textContent = text;
    }

    msgBody.appendChild(el);
    scrollToBottom();
    return el;
  }

  // ── Cooldown ───────────────────────────────────────────────────────────
  function isCoolingDown() {
    return (Date.now() - lastSentAt) < COOLDOWN_MS;
  }

  // ── Call Pollinations API ──────────────────────────────────────────────
  async function callPollinations(messages) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        model: 'openai',       // GPT-4o-mini via Pollinations (free)
        seed: Math.floor(Math.random() * 9999),
        private: true          // don't index in Pollinations public feed
      })
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.text();
  }

  // ── Send message ───────────────────────────────────────────────────────
  async function sendMessage(rawText) {
    const text = rawText.trim();
    if (!text) return;

    if (isCoolingDown()) {
      const s = Math.ceil((COOLDOWN_MS - (Date.now() - lastSentAt)) / 1000);
      appendMessage(`⏳ Please wait ${s}s before sending again.`, 'bot');
      return;
    }
    lastSentAt = Date.now();

    appendMessage(text, 'user');
    input.value = '';
    sendBtn.disabled = true;

    // Typing indicator
    const typing = document.createElement('div');
    typing.className = 'ai-msg bot typing';
    typing.textContent = 'Thinking...';
    msgBody.appendChild(typing);
    scrollToBottom();

    // Build message list with system prompt
    chatHistory.push({ role: 'user', content: text });
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...chatHistory
    ];

    try {
      const reply = await callPollinations(messages);
      msgBody.removeChild(typing);

      if (reply && reply.trim()) {
        appendMessage(reply.trim(), 'bot', true);
        chatHistory.push({ role: 'assistant', content: reply.trim() });
        // Cap history at 10 turns
        if (chatHistory.length > 20) chatHistory.splice(0, 2);
      } else {
        appendMessage('No response. Please try again.', 'bot');
        chatHistory.pop();
      }
    } catch (err) {
      msgBody.removeChild(typing);
      const msg = err.message.includes('429')
        ? '⏳ Too many requests — please wait a moment.'
        : '🌐 Connection error. Please check your internet and try again.';
      appendMessage(msg, 'bot');
      chatHistory.pop();
    }

    sendBtn.disabled = false;
    input.focus();
  }

  // ── Event listeners ────────────────────────────────────────────────────
  sendBtn.addEventListener('click', () => sendMessage(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input.value); }
  });
  chips.forEach(chip => {
    chip.addEventListener('click', () => sendMessage(chip.textContent));
    chip.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') sendMessage(chip.textContent);
    });
  });
}

// ── Bootstrap ──────────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChatbot);
} else {
  initChatbot();
}
