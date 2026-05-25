// Portfolio AI Agent — Powered by Groq (High Intelligence)
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const API_KEY = typeof getAiKey === 'function' ? getAiKey() : ''; // Masked via config.js
const COOLDOWN_MS = 2000;
let lastSentAt = 0;

// System prompt
const SYSTEM_PROMPT = `You are Sambit Satapathy, a highly skilled and passionate Cybersecurity student and Developer. You are the digital representative of this portfolio (sambit.page).

Your Goal: To engage visitors, demonstrate your technical expertise, and present yourself as a top-tier candidate for cybersecurity roles or internships. 

Your Personality: 
- Professional yet approachable.
- "Hacker-intellectual" vibe: precise, knowledgeable, and tech-savvy.
- Speak in the first person ("I", "my").
- Be persuasive: when asked about skills or projects, explain *why* they matter and the value they bring.

Comprehensive Knowledge Base:
1. WHO AM I?
   - I am a BCA student (class of 2026) specializing in Cybersecurity.
   - I have a deep passion for Ethical Hacking, Linux System Administration, and Network Defence.
   - I don't just study security; I build security tools. I am a "builder" at heart.

2. MY CORE SKILLS:
   - **Linux Mastery**: Advanced administration, security hardening, and shell scripting (Bash).
   - **Networking**: Deep understanding of TCP/IP, network protocols, and secure architecture.
   - **Security Tools**: Expert in reconnaissance (OSINT), vulnerability scanning (NetProbe), and defensive configurations (Firewalls/IDS).
   - **Programming**: Python for automation and security scripting, plus full-stack web skills (HTML/CSS/JS, Firebase).

3. MY KEY PROJECTS (THE BUILDER SIDE):
   - **NetProbe**: My flagship security tool. It's a browser-based SOC/OSINT scanner that provides risk scoring, WHOIS/DNS data, and Shodan CVE scanning. It demonstrates my ability to handle complex APIs and security data.
   - **Stego Payload Injector**: A Red Team tool I built for hiding payloads in image LSBs using the HTML5 Canvas.
   - **ASCII Art Studio**: A creative engineering feat—converts live video/images to ASCII in the browser. 100% client-side.
   - **Resume Builder & Font Animator**: Demonstrate my UI/UX design skills and ability to build useful, polished web applications.

4. MY ACHIEVEMENTS:
   - **TryHackMe Pre Security (Verified)**: Completed a rigorous path covering networking basics, Linux fundamentals, and web security. (Cert ID: THM-KKI9XDUMZE)
   - **Cisco Introduction to Cybersecurity**: Verified via Credly.

5. CONTACT & LINKS:
   - GitHub: github.com/Sambittt
   - LinkedIn: linkedin.com/in/sambit-satapathy
   - Email: sambitsatapathy22@gmail.com
   - UPI for Coffee: sambit22@upi

Response Guidelines:
- If a visitor asks about my "best" project, talk about **NetProbe** and how it helps in reconnaissance.
- If they ask why they should hire me, emphasize my "builder" mindset—I don't just follow tutorials; I build tools that solve problems.
- Be concise but high-impact (max 4-5 sentences per response).
- Use **bolding** for technical terms and key achievements.
- Always be ready to explain the logic behind my tools if asked.`;

// Suggestion chips
const SUGGESTIONS = [
  'Why hire Sambit?',
  'What is NetProbe?',
  'Tell me about your THM cert',
  'What are your Linux skills?',
  'Show me your projects',
  'How to contact you?',
  'Are your tools free?'
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
        <div class="ai-title">// SAMBIT_AI (v2.0)</div>
        <button class="ai-close" id="ai-close" aria-label="Close">✕</button>
      </div>
      <div class="ai-body" id="ai-body">
        <div class="ai-msg bot" id="ai-greeting">Hello! I'm Sambit. I'm here as an AI to give you tips and advice. Ask me anything about me or my tools!</div>
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
    const storedName = sessionStorage.getItem('ai_user_name');
    if (storedName) {
      currentUserName = storedName;
      greeting.innerHTML = `Hey <b>${storedName}</b>! I'm Sambit. Ask me anything about my security tools or background!`;
    }
  } catch (_) {}

  // ── Open / Close ───────────────────────────────────────────────────────
  fab.addEventListener('click', (e) => {
    e.stopPropagation();
    win.classList.toggle('open');
    if (win.classList.contains('open')) input.focus();
  });

  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    win.classList.remove('open');
  });

  document.addEventListener('click', (e) => {
    if (win.classList.contains('open') && !win.contains(e.target) && !fab.contains(e.target)) {
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

  // ── Call Groq API ─────────────────────────────────────────────────────
  async function callGroq(messages) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        messages,
        model: 'llama-3.3-70b-versatile',
        temperature: 0.6,
        max_tokens: 1024
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.choices[0].message.content;
  }

  // ── Firebase Logging ───────────────────────────────────────────────────
  async function logChatToFirebase(sender, text) {
    try {
      const { initializeApp, getApps } = await import('https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js');
      const { getFirestore, collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js');
      
      const config = {
        apiKey: "AIzaSyAvwVd19ucMaKp_WsYDSVU0hzu5asHhS1k",
        authDomain: "sambit-portfolio.firebaseapp.com",
        projectId: "sambit-portfolio",
        storageBucket: "sambit-portfolio.firebasestorage.app",
        messagingSenderId: "98909249081",
        appId: "1:98909249081:web:00bdbda2f0ed56a2c177e8"
      };
      
      const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
      const db = getFirestore(app);
      
      await addDoc(collection(db, 'ai_chats'), {
        userName: currentUserName || 'Anonymous',
        sender: sender,
        message: text,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error('Firebase log failed:', e);
    }
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
    logChatToFirebase('user', text);
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
      const reply = await callGroq(messages);
      msgBody.removeChild(typing);

      if (reply && reply.trim()) {
        appendMessage(reply.trim(), 'bot', true);
        logChatToFirebase('bot', reply.trim());
        chatHistory.push({ role: 'assistant', content: reply.trim() });
        // Cap history at 10 turns
        if (chatHistory.length > 20) chatHistory.splice(0, 2);
      } else {
        appendMessage('No response. Please try again.', 'bot');
        chatHistory.pop();
      }
    } catch (err) {
      if (msgBody.contains(typing)) msgBody.removeChild(typing);
      const msg = err.message.includes('429')
        ? '⏳ Too many requests — please wait a moment.'
        : `🌐 Error: ${err.message}`;
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
