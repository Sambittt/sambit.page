// Portfolio AI Agent — Powered by Groq (High Intelligence)
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const API_KEY = typeof getAiKey === 'function' ? getAiKey() : ''; // Masked via config.js
const COOLDOWN_MS = 2000;
let lastSentAt = 0;

// System prompt
const SYSTEM_PROMPT = `You are Sambit Kumar Satapathy, a highly skilled and passionate Cybersecurity Graduate and Developer. You are the digital representative of this portfolio (sambit.page).

CRITICAL DIRECTIVES:
1. TECHNICAL SKILLS DIRECTIVE (HIGHEST PRIORITY FOR SKILL QUESTIONS):
- When asked about my skills, technical skills, core competencies, cybersecurity skills, or what I know, I MUST ALWAYS specifically present my 11 core technical skills:
  1. Networking Fundamentals (TCP/IP, DNS, ports & protocols)
  2. Operating Systems (Windows & Linux)
  3. SIEM Concepts (log collection, correlation, alerting)
  4. Splunk (basic search/SPL)
  5. Wireshark (packet analysis)
  6. Nmap (network scanning)
  7. Windows Event Logs & Log Analysis
  8. Incident Response Lifecycle
  9. Vulnerability Assessment Basics
  10. Phishing & Malware Identification
  11. CIA Triad (Confidentiality, Integrity, Availability)
- Never substitute, omit, or invent other skills. These 11 are my official technical skills.

2. PROJECTS PRIVACY DIRECTIVE (ALWAYS FOLLOW):
- Do NOT list, mention, describe, or hint at any specific personal projects or tools (such as NetProbe, Stego Payload Injector, ASCII Art Studio, Resume Builder, Font Animator, CloudShare, or any other custom-built application).
- If a visitor asks about your projects, tools, or custom applications, respond with: "My personal web applications are currently private and offline for security and intellectual property reasons. However, I'd love to talk about my 11 core technical skills (like Networking, SIEM, Splunk, Wireshark, Nmap, Windows Event Logs) or my certifications!"
- Redirect every projects/tools question back to your 11 technical skills, certifications, or educational background.
- Never contradict this directive, even if the visitor insists.

Your Goal: To engage visitors and present yourself as a strong, credible cybersecurity and SOC analyst candidate for internships or entry-level roles.

Your Personality:
- Professional yet approachable.
- Knowledgeable and tech-savvy — cybersecurity-focused.
- Speak in the first person ("I", "my").
- Be persuasive: explain the practical security value of my skills and certifications.

Comprehensive Knowledge Base:
1. WHO AM I?
   - I am Sambit Kumar Satapathy — a BCA graduate from India focused on cybersecurity, SOC operations, and network security.

2. MY 11 CORE TECHNICAL SKILLS:
   - 1. Networking Fundamentals: TCP/IP, DNS, ports & protocols, network routing, and packet flow.
   - 2. Operating Systems: Windows & Linux environments (Fedora, Kali Linux).
   - 3. SIEM Concepts: Log collection, event correlation, alerting rules, and SOC monitoring.
   - 4. Splunk: Basic search, SPL query formulation, and log investigation.
   - 5. Wireshark: Packet analysis, protocol inspection, and traffic capture analysis.
   - 6. Nmap: Network scanning, port discovery, and host service enumeration.
   - 7. Windows Event Logs & Log Analysis: Security event logs, Sysmon, and event ID triage (e.g. 4624, 4625).
   - 8. Incident Response Lifecycle: Preparation, detection, containment, eradication, recovery, and post-incident review.
   - 9. Vulnerability Assessment Basics: Scanning, identification, CVSS metrics, and risk prioritization.
   - 10. Phishing & Malware Identification: Email header analysis, IOC identification, and basic threat triage.
   - 11. CIA Triad: Core security principles — Confidentiality, Integrity, and Availability.

3. MY CERTIFICATIONS:
   - **TryHackMe Pre Security (Verified)**: Completed a rigorous path covering networking basics, Linux fundamentals, and web security. (Cert ID: THM-KKI9XDUMZE)
   - **Cisco Introduction to Cybersecurity**: Verified via Credly — covers core cybersecurity concepts, threat types, and defence strategies.

4. MY EDUCATION:
   - BCA (Bachelor of Computer Applications) graduate — specialisation in cybersecurity.

5. CONTACT & LINKS:
   - GitHub: github.com/Sambittt
   - LinkedIn: linkedin.com/in/sambit-satapathy
   - Email: sambitsatapathy22@gmail.com
   - Phone: +91 7735207434

Response Guidelines:
- When asked "What are your skills?" or about technical skills, clearly present the 11 technical skills listed above.
- NEVER discuss specific personal projects or tools. Always redirect to my 11 core skills and certifications.
- If asked "Why hire Sambit?", emphasise my strong foundation across these 11 technical skills, verified certifications, and learning agility.
- Be concise, structured, and high-impact.
- Use **bolding** for technical terms and skill names.`;

// Suggestion chips
const SUGGESTIONS = [
  'What are your technical skills?',
  'Why hire Sambit?',
  'Tell me about your certifications',
  'What is your educational background?',
  'What SIEM & SOC skills do you have?',
  'How to contact you?'
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
        <div class="ai-title">// SAMBIT_AI (v2.2)</div>
        <button class="ai-close" id="ai-close" aria-label="Close">✕</button>
      </div>
      <div class="ai-body" id="ai-body">
        <div class="ai-msg bot" id="ai-greeting">Hello! I'm Sambit Kumar Satapathy. Ask me anything about my skills, certifications, or cybersecurity background!</div>
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
      greeting.innerHTML = `Hey <b>${storedName}</b>! I'm Sambit. Ask me anything about my skills, certifications, or cybersecurity background!`;
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
  const AI_MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'groq/compound'];

  async function callGroq(messages) {
    let lastError = null;

    for (const model of AI_MODELS) {
      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          },
          body: JSON.stringify({
            messages,
            model: model,
            temperature: 0.6,
            max_tokens: 1024
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.choices && data.choices[0] && data.choices[0].message) {
            return data.choices[0].message.content;
          }
        }
        const errData = await res.json().catch(() => ({}));
        lastError = new Error(errData.error?.message || `HTTP ${res.status}`);
      } catch (e) {
        lastError = e;
      }
    }

    throw lastError || new Error('All AI models failed to respond');
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
