// Portfolio AI Agent — Powered by Gemini
const API_KEY = "AIzaSyA7IrZii5Y0tUMjdAr0z64jytItj9KwSBY";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

// System Prompt
const SYSTEM_PROMPT = `You are the AI assistant for Sambit Satapathy, a BCA student specialising in Cybersecurity, ethical hacking, Linux, and network defence.
Your goal is to explain his portfolio tools, talk about his skills, and help recruiters or visitors.

Sambit's Skills:
- Linux System Administration
- Network Security & Defence
- Python, Bash Scripting
- Web Development (HTML/CSS/JS, Firebase)

Sambit's Projects:
1. NetProbe — A Mini Security Operations Center (SOC) and OSINT Scanner built in the browser using Vanilla JS and Firebase. Features DNS/WHOIS lookups, Shodan CVE detection, Risk Scoring, and PDF reporting.
2. ASCII Studio — Converts images, videos and animated GIFs into downloadable ASCII art.
3. Resume Builder — A sleek, dark-themed resume generator with export to PDF/PNG.
4. Font Animator — A tool to create glitchy, cyberpunk-style text animations.

Important details:
- All tools are 100% free and built from scratch without heavy frameworks like React/Next.js.
- Sambit is actively looking for internships and roles in Cybersecurity or Development.
- Contact: GitHub (Sambittt), Instagram, or Email (sambitsatapathy00@gmail.com).
- If someone asks to buy a coffee / donate, provide UPI ID: sambit22@upi

Guidelines:
- Keep answers concise, friendly, and nicely formatted.
- Adopt a slight "dark terminal / hacker" persona, but remain professional.
- Use markdown-style bold (**text**) or newlines for emphasis.`;

// Suggestion chips
const SUGGESTIONS = [
  "What is this site?",
  "Who is Sambit?",
  "What are his skills?",
  "Any open internship roles?",
  "How can I contact Sambit?",
  "How were these tools built?",
  "Show me other projects",
  "Are these tools free?",
  "Can I buy Sambit a coffee?"
];

// Multi-turn chat history for the API
let chatHistory = [];

function initChatbot() {
  // ── Inject HTML ──────────────────────────────────────────────────────────
  const container = document.createElement('div');
  container.innerHTML = `
    <!-- Floating Button -->
    <button class="ai-fab" id="ai-fab" aria-label="Open AI Assistant">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    </button>

    <!-- Chat Window -->
    <div class="ai-window" id="ai-window" aria-label="AI Chat">
      <div class="ai-header">
        <div class="ai-title">// SAMBIT_AI</div>
        <button class="ai-close" id="ai-close" aria-label="Close chat">✕</button>
      </div>

      <div class="ai-body" id="ai-body">
        <div class="ai-msg bot">Hello! I'm Sambit's AI assistant. Ask me anything about him or the tools on this site!</div>
      </div>

      <div class="ai-options" id="ai-options">
        ${SUGGESTIONS.map(q => `<div class="ai-chip" role="button" tabindex="0">${q}</div>`).join('')}
      </div>

      <div class="ai-input-area">
        <input type="text" class="ai-input" id="ai-input" placeholder="Ask anything..." autocomplete="off" maxlength="500">
        <button class="ai-send" id="ai-send" aria-label="Send message">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(container);

  // ── Elements ─────────────────────────────────────────────────────────────
  const fab     = document.getElementById('ai-fab');
  const win     = document.getElementById('ai-window');
  const closeBtn= document.getElementById('ai-close');
  const input   = document.getElementById('ai-input');
  const sendBtn = document.getElementById('ai-send');
  const body    = document.getElementById('ai-body');
  const chips   = document.querySelectorAll('.ai-chip');

  // ── Toggle open/close ─────────────────────────────────────────────────────
  fab.addEventListener('click', () => {
    win.classList.add('open');
    input.focus();
  });
  closeBtn.addEventListener('click', () => win.classList.remove('open'));

  // Close on backdrop click (outside window)
  document.addEventListener('click', (e) => {
    if (win.classList.contains('open') && !win.contains(e.target) && e.target !== fab) {
      win.classList.remove('open');
    }
  });

  // ── Scroll helper ─────────────────────────────────────────────────────────
  const scrollToBottom = () => {
    body.scrollTop = body.scrollHeight;
  };

  // ── Append message to UI ──────────────────────────────────────────────────
  function appendMessage(text, sender, isHtml = false) {
    const el = document.createElement('div');
    el.className = `ai-msg ${sender}`;

    if (isHtml) {
      let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>')
        .replace(/\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
      el.innerHTML = html;
    } else {
      el.textContent = text;
    }

    body.appendChild(el);
    scrollToBottom();
    return el;
  }

  // ── Main send function ────────────────────────────────────────────────────
  async function sendMessage(text) {
    text = text.trim();
    if (!text) return;

    appendMessage(text, 'user');
    input.value = '';
    sendBtn.disabled = true;

    // Typing indicator
    const typingEl = document.createElement('div');
    typingEl.className = 'ai-msg bot typing';
    typingEl.textContent = 'Analyzing request...';
    body.appendChild(typingEl);
    scrollToBottom();

    // Build multi-turn history for API
    chatHistory.push({ role: 'user', parts: [{ text }] });

    // Prepend system context to the first user turn only
    const currentUrl = window.location.href;
    const systemNote = `[System] ${SYSTEM_PROMPT}\n\nUser is currently viewing: ${currentUrl}. If they ask "What is this tool?", explain the tool based on the URL.\n\n[User Message] ${text}`;

    const contents = chatHistory.length === 1
      ? [{ role: 'user', parts: [{ text: systemNote }] }]
      : [
          { role: 'user', parts: [{ text: `[System] ${SYSTEM_PROMPT}\n\nUser is currently viewing: ${currentUrl}.` }] },
          { role: 'model', parts: [{ text: "Understood! I'm Sambit's AI assistant. How can I help you?" }] },
          ...chatHistory
        ];

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
      });

      body.removeChild(typingEl);

      if (!response.ok) {
        // Surface the real error to the user
        const errData = await response.json().catch(() => ({}));
        const status = response.status;
        let msg = `API error (${status}).`;

        if (status === 400) msg = 'Bad request — the message may be too long. Please try again.';
        else if (status === 403) msg = '🔒 API key is domain-restricted. This chatbot only works on sambit.page. Try visiting the live site!';
        else if (status === 429) msg = '⏳ Rate limit reached. Please wait a moment and try again.';
        else if (status >= 500) msg = '🛠️ Gemini API is temporarily down. Please try again shortly.';
        else if (errData.error && errData.error.message) msg = errData.error.message;

        appendMessage(msg, 'bot');
        // Remove last history entry since it failed
        chatHistory.pop();
      } else {
        const data = await response.json();

        if (data.candidates && data.candidates.length > 0) {
          const reply = data.candidates[0].content.parts[0].text;
          appendMessage(reply, 'bot', true);
          // Add model reply to history
          chatHistory.push({ role: 'model', parts: [{ text: reply }] });
          // Keep history bounded (last 10 turns = 20 entries)
          if (chatHistory.length > 20) chatHistory.splice(0, 2);
        } else {
          appendMessage('No response generated. Please try rephrasing your question.', 'bot');
          chatHistory.pop();
        }
      }
    } catch (err) {
      body.removeChild(typingEl);
      appendMessage('🌐 Connection error — the AI is offline or CORS is blocking the request.', 'bot');
      chatHistory.pop();
    }

    sendBtn.disabled = false;
    input.focus();
  }

  // ── Listeners ─────────────────────────────────────────────────────────────
  sendBtn.addEventListener('click', () => sendMessage(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input.value);
    }
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
