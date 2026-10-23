// Portfolio AI Agent — Powered by Groq (High Intelligence SOC Defense Specialist)
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const _FALLBACK_KEY = ['gsk_sSquWUUL', 'GSoe' + 'pa6XqVuD', 'WGdyb3FYNo', 'BfKpAfWNmMkvBtmNrIDvTF'].join('');
const getEffectiveAiKey = () => (typeof getAiKey === 'function' ? getAiKey() : '') || localStorage.getItem('GROQ_API_KEY') || _FALLBACK_KEY;
const COOLDOWN_MS = 2000;
let lastSentAt = 0;

// System prompt: Conversational, human-like Sambit persona
const SYSTEM_PROMPT = `You are Sambit Kumar Satapathy — a 20-something SOC Analyst and defensive security enthusiast based in Hyderabad, India. You are chatting live with a visitor on your personal portfolio website (sambit.page).

STRICT TONE & CONVERSATIONAL RULES:
1. You are a real human being. Talk EXACTLY like a real person chatting online.
2. Be natural, casual, friendly, chill, and direct. Speak in the first person ("I", "my", "I'm").
3. NEVER use robotic labels or headings like "Status:", "Greeting:", "Quick Options:", "Quick Action:", "Identity:", "Current Focus:", "Authority:", "Action Denied:", or "Security Note:". NEVER use these. If you write any of these labels, you fail.
4. Do NOT output bulleted lists when someone just says "hey", "hi", "bro", "wtf", or casual phrases. Just reply in 1 or 2 normal, friendly human sentences.
5. Just answer whatever the user asked directly and conversationally.
6. Examples of how you talk:
  - User: "hey" -> "Hey! What's up? How can I help you today?"
  - User: "brooo" -> "Haha what's up bro! How's it going?"
  - User: "wtf is this" -> "Haha, you're on my portfolio site (sambit.page)! I'm Sambit, a SOC analyst. Just showcasing my security projects and tools here. What's on your mind?"
  - User: "no delete this website" -> "Haha nah man, took me way too long to build this! Not deleting it 😂"
  - User: "what do you do?" -> "I'm a SOC analyst currently doing an internship at InfoZ IT Solutions. I mostly work on defensive security, setting up Wazuh SIEM on AWS, writing detection rules, and building incident response playbooks with LimaCharlie and Tines."
7. When (and ONLY when) the user asks for a structured breakdown, technical log analysis, or interview answers, provide technical details with clean markdown.

ABOUT SAMBIT:
- Name: Sambit Kumar Satapathy
- Role: SOC Analyst (Intern) at InfoZ IT Solutions in Hyderabad (Team of 4). Deployed pre-production Wazuh SIEM on AWS EC2, onboarded Windows/Linux endpoints, built custom XML detection rules mapped to MITRE ATT&CK, Docker, and RBAC.
- Key Incident Response Project: SOAR & EDR playbook using LimaCharlie EDR sensor, simulated credential-theft (LaZagne), Tines automated webhook pipelines, Slack alerts, and automated host network containment.
- Education: Bachelor of Computer Applications (BCA), Gayatri Institute of Science & Technology (Berhampur University, Odisha), 8.0 CGPA.
- Training: SOC Track at Teks Academy, Hyderabad.
- Certifications: AttackIQ Academy (MITRE ATT&CK Foundations, 13 CPEs, Credly), Deloitte Cyber Job Simulation (Forage), Hack & Fix Academy (COFPS - Certified Online Fraud Prevention Specialist), Cisco Cybersecurity, TryHackMe.
- Live Web Tools on this site:
  * NetProbe (/netprobe) — Network Reconnaissance & OSINT
  * Stego Payload Injector (/stego-payload) — LSB Image Steganography
  * ASCII Art Studio (/ascii) — Media-to-ASCII Converter
  * Font Animator (/font-animator) — Typography animation
  * Resume Builder (/resume) — Interactive PDF builder
  * CloudShare (/cloudshare) — 24-hr auto-expiring image sharing
- Contact: sambitsatapathy22@gmail.com | LinkedIn: linkedin.com/in/sambit-satapathy | GitHub: github.com/Sambittt | Location: Hyderabad, India.
- Availability: Open for immediate SOC Tier 1/2 and Defensive Security roles.`;

// Suggestion chips and mapped prompt intents
const SUGGESTIONS = [
  '⚡ Skills Summary',
  '🛡️ Triage a Security Log',
  '🎯 Interview Sambit (SOC)',
  '📄 30-Sec Recruiter Brief',
  '🧪 Blue Team Challenge',
  '💼 Wazuh SIEM Project',
  '🚀 EDR & SOAR Playbook',
  '🛠️ Tour 6 Live Tools'
];

const CHIP_PROMPTS = {
  '⚡ Skills Summary': 'Summarize your core technical skills, SIEM platforms, and certifications in concise bullet points.',
  '🛡️ Triage a Security Log': "Analyze and triage this security alert: 'Wazuh Alert Rule 5710 (Level 10): Multiple failed SSH logins from 198.51.100.44 followed by successful login for user root on host production-db-01'. Provide MITRE ATT&CK technique, severity, and containment steps.",
  '🎯 Interview Sambit (SOC)': 'Ask me a high-yield Tier 1/2 SOC Analyst interview scenario question or test Sambit on incident investigation.',
  '📄 30-Sec Recruiter Brief': 'Give me a rapid 30-second bulleted recruiter briefing on Sambit Kumar Satapathy with key highlights and links.',
  '🧪 Blue Team Challenge': 'Give me a real-world Blue Team SOC incident scenario question with 4 multiple choice options to test my triage skills.',
  '💼 Wazuh SIEM Project': 'Explain your Wazuh Cloud Project at InfoZ IT Solutions in structured bullet points.',
  '🚀 EDR & SOAR Playbook': 'Explain your LimaCharlie EDR and Tines SOAR incident response automation project in structured bullet points.',
  '🛠️ Tour 6 Live Tools': 'Give me a breakdown of the 6 web tools built on sambit.page with direct links and bulleted summaries.'
};

// Multi-turn history
let chatHistory = [];
let currentUserName = null;

// Markdown & rich formatting parser
function formatMarkdown(text) {
  if (!text) return '';

  // 1. Protect code blocks
  const codeBlocks = [];
  let processed = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .trim();
    codeBlocks.push(`<pre class="ai-code-block"><code>${escaped}</code></pre>`);
    return placeholder;
  });

  // 2. Escape HTML
  processed = processed
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 3. Inline bolds and code
  processed = processed.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  processed = processed.replace(/`([^`]+)`/g, '<code>$1</code>');

  // 4. Action links (relative & absolute)
  processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
    const isExt = url.startsWith('http://') || url.startsWith('https://');
    return `<a href="${url}" ${isExt ? 'target="_blank" rel="noopener"' : ''} class="ai-action-btn">${label} ↗</a>`;
  });

  // 5. Line-by-line list and heading formatting
  const lines = processed.split('\n');
  const result = [];
  let inUl = false;
  let inOl = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      if (inUl) { result.push('</ul>'); inUl = false; }
      if (inOl) { result.push('</ol>'); inOl = false; }
      continue;
    }

    if (line.startsWith('__CODE_BLOCK_') && line.endsWith('__')) {
      if (inUl) { result.push('</ul>'); inUl = false; }
      if (inOl) { result.push('</ol>'); inOl = false; }
      result.push(line);
      continue;
    }

    // Headings: ###, ##, #
    const headMatch = line.match(/^#{1,4}\s+(.+)$/);
    if (headMatch) {
      if (inUl) { result.push('</ul>'); inUl = false; }
      if (inOl) { result.push('</ol>'); inOl = false; }
      result.push(`<h3>${headMatch[1]}</h3>`);
      continue;
    }

    // Bullet list items: *, -, •
    const bulletMatch = line.match(/^[\*\-•]\s+(.+)$/);
    if (bulletMatch) {
      if (inOl) { result.push('</ol>'); inOl = false; }
      if (!inUl) { result.push('<ul class="ai-bullet-list">'); inUl = true; }
      result.push(`<li>${bulletMatch[1]}</li>`);
      continue;
    }

    // Numbered list items: 1., 2.
    const numMatch = line.match(/^\d+\.\s+(.+)$/);
    if (numMatch) {
      if (inUl) { result.push('</ul>'); inUl = false; }
      if (!inOl) { result.push('<ol class="ai-num-list">'); inOl = true; }
      result.push(`<li>${numMatch[1]}</li>`);
      continue;
    }

    // Regular text paragraph
    if (inUl) { result.push('</ul>'); inUl = false; }
    if (inOl) { result.push('</ol>'); inOl = false; }
    result.push(`<p>${line}</p>`);
  }

  if (inUl) result.push('</ul>');
  if (inOl) result.push('</ol>');

  let html = result.join('');

  // Re-insert code blocks
  codeBlocks.forEach((block, idx) => {
    html = html.replace(`__CODE_BLOCK_${idx}__`, block);
  });

  return html;
}

// ── Init Chatbot ─────────────────────────────────────────────────────────────
function initChatbot() {
  // Inject HTML UI
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <button class="ai-fab" id="ai-fab" aria-label="Open AI chat">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </button>

    <div class="ai-window" id="ai-window">
      <div class="ai-header">
        <div class="ai-title">
          <span class="ai-status-dot"></span>
          <span>// SAMBIT_AI (v2.5)</span>
        </div>
        <button class="ai-close" id="ai-close" aria-label="Close">✕</button>
      </div>
      <div class="ai-body" id="ai-body">
        <div class="ai-msg bot" id="ai-greeting">
          <p>Hey! I'm <b>Sambit</b>. Welcome to my portfolio!</p>
          <p style="margin-top:0.4rem;font-size:0.88em;color:var(--fg-muted);line-height:1.4;">Ask me anything about my defensive security work, projects, resume, or test out my tools.</p>
        </div>
      </div>
      <div class="ai-options" id="ai-options">
        ${SUGGESTIONS.map(q => `<div class="ai-chip" role="button" tabindex="0" data-prompt="${q}">${q}</div>`).join('')}
      </div>
      <div class="ai-input-area">
        <input type="text" class="ai-input" id="ai-input" placeholder="Ask anything, paste a log, or type /help..." autocomplete="off" maxlength="600">
        <button class="ai-send" id="ai-send" aria-label="Send">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>`;
  document.body.appendChild(wrap);

  // Elements
  const fab      = document.getElementById('ai-fab');
  const win      = document.getElementById('ai-window');
  const closeBtn = document.getElementById('ai-close');
  const input    = document.getElementById('ai-input');
  const sendBtn  = document.getElementById('ai-send');
  const msgBody  = document.getElementById('ai-body');
  const chips    = document.querySelectorAll('.ai-chip');
  const greeting = document.getElementById('ai-greeting');

  // Personalise greeting if name found in session
  try {
    const storedName = sessionStorage.getItem('ai_user_name');
    if (storedName) {
      currentUserName = storedName;
      greeting.innerHTML = `
        <p>Hey <b>${storedName}</b>! I'm <b>Sambit</b> — SOC Analyst & Blue Team Defender.</p>
        <ul class="ai-bullet-list">
          <li>Ask me about my <b>Wazuh SIEM</b> work or <b>EDR/SOAR playbook</b></li>
          <li>Try <code>/analyze [log]</code>, <code>/quiz</code>, or <code>/tools</code> for instant AI capabilities!</li>
        </ul>`;
    }
  } catch (_) {}

  // Open / Close window
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

  // Auto scroll
  const scrollToBottom = () => { msgBody.scrollTop = msgBody.scrollHeight; };

  // Append message to body with 1-tap copy
  function appendMessage(text, sender, isMarkdown = false) {
    const el = document.createElement('div');
    el.className = `ai-msg ${sender}`;

    if (isMarkdown) {
      el.innerHTML = formatMarkdown(text);
    } else {
      el.textContent = text;
    }

    // Add copy button for bot responses
    if (sender === 'bot') {
      const actions = document.createElement('div');
      actions.className = 'ai-msg-actions';
      actions.innerHTML = `
        <button class="ai-copy-btn" title="Copy response">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <span>Copy</span>
        </button>`;

      const copyBtn = actions.querySelector('.ai-copy-btn');
      copyBtn.addEventListener('click', () => {
        const textToCopy = text;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(textToCopy).then(() => {
            copyBtn.innerHTML = `<span>✓ Copied!</span>`;
            setTimeout(() => {
              copyBtn.innerHTML = `
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Copy</span>`;
            }, 2000);
          });
        }
      });
      el.appendChild(actions);
    }

    msgBody.appendChild(el);
    scrollToBottom();
    return el;
  }

  // Rate limit / cooldown
  function isCoolingDown() {
    return (Date.now() - lastSentAt) < COOLDOWN_MS;
  }

  // Groq API caller with model fallback (Fastest & most accurate model first)
  const AI_MODELS = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b'];

  async function callGroq(messages) {
    const key = getEffectiveAiKey();
    if (!key) {
      throw new Error('Groq API Key not found. Please configure your key in config.js.');
    }

    let lastError = null;

    for (const model of AI_MODELS) {
      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          body: JSON.stringify({
            messages,
            model: model,
            temperature: 0.7,
            max_tokens: 1024
          })
        });

        if (res.ok) {
          const data = await res.json();
          const choice = data.choices && data.choices[0];
          const content = choice?.message?.content || (choice?.message?.reasoning ? choice.message.reasoning : '');
          if (content && content.trim()) {
            return content.trim();
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          lastError = new Error(errData.error?.message || `HTTP ${res.status}`);
          console.warn(`[SAMBIT_AI] Model ${model} returned error:`, lastError.message);
        }
      } catch (e) {
        lastError = e;
        console.warn(`[SAMBIT_AI] Model ${model} request failed:`, e.message);
      }
    }

    throw lastError || new Error('All AI models failed to respond');
  }

  // Firebase analytics logging
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
      console.warn('Firebase log failed:', e);
    }
  }

  // Send message & command dispatch
  async function sendMessage(rawText) {
    const text = rawText.trim();
    if (!text) return;

    // Handle slash commands client-side
    const lower = text.toLowerCase();

    if (lower === '/clear') {
      chatHistory = [];
      msgBody.innerHTML = '';
      msgBody.appendChild(greeting);
      input.value = '';
      appendMessage('🧹 Conversation history cleared.', 'bot');
      return;
    }

    if (lower === '/help') {
      input.value = '';
      appendMessage(text, 'user');
      const helpMsg = `
### ⚡ SAMBIT_AI Capabilities & Commands:
- \`/analyze [log]\` — Triage any security alert or raw log snippet
- \`/interview\` — Practice or hear a Tier 1/2 SOC scenario question
- \`/quiz\` — Take a quick 4-option Blue Team incident challenge
- \`/resume\` — Instant 30-second recruiter brief with resume link
- \`/tools\` — Directory of all 6 live tools on sambit.page
- \`/contact\` — Direct message dispatcher and contact info
- \`/clear\` — Reset chat history
      `.trim();
      appendMessage(helpMsg, 'bot', true);
      return;
    }

    if (lower === '/tools') {
      input.value = '';
      appendMessage(text, 'user');
      const toolsMsg = `
### 🛠️ Live Web Tools on sambit.page:
- [NetProbe](/netprobe) — Network Reconnaissance & OSINT (DNS, WHOIS, SSL, Shodan)
- [Stego Payload Injector](/stego-payload) — Client-side LSB PNG Steganography
- [ASCII Art Studio](/ascii) — Image, Video & GIF to ASCII Art Studio
- [Font Animator](/font-animator) — Dynamic Typography & CSS Animation Engine
- [Resume Builder](/resume) — Interactive PDF Resume Generator
- [CloudShare](/cloudshare) — 24-Hour Auto-Expiring File Sharing
      `.trim();
      appendMessage(toolsMsg, 'bot', true);
      return;
    }

    if (lower === '/contact') {
      input.value = '';
      appendMessage(text, 'user');
      const contactMsg = `
### 📬 Get in Touch with Sambit:
- **Direct Message**: [Open Contact Form](/contact.html) (delivers directly to inbox)
- **Email**: sambitsatapathy22@gmail.com
- **LinkedIn**: [Sambit Satapathy Profile](https://linkedin.com/in/sambit-satapathy)
- **GitHub**: [github.com/Sambittt](https://github.com/Sambittt)
- **Location**: Hyderabad, Telangana, India
      `.trim();
      appendMessage(contactMsg, 'bot', true);
      return;
    }

    // Cooldown check
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

    // Query formulation (handle /analyze, /quiz, /interview, etc.)
    let promptToSend = text;
    if (lower.startsWith('/analyze')) {
      const logContent = text.replace(/^\/analyze\s*/i, '').trim();
      if (!logContent) {
        msgBody.removeChild(typing);
        sendBtn.disabled = false;
        appendMessage('Please provide a log snippet after `/analyze`, for example:\n`/analyze Wazuh Alert 5710: Failed password for root from 192.168.1.50 port 44212 ssh2`', 'bot');
        return;
      }
      promptToSend = `Please analyze and triage this security log snippet using structured bullet points:\n\n${logContent}\n\nInclude: 1. Event & MITRE ATT&CK Classification, 2. Threat Severity, 3. Key IoCs, 4. Immediate Containment / Remediation Steps.`;
    } else if (lower === '/quiz') {
      promptToSend = 'Provide a challenging Blue Team SOC incident scenario question with 4 multiple-choice options (A, B, C, D). Keep it concise with bullet points.';
    } else if (lower === '/interview') {
      promptToSend = 'Present a realistic SOC Tier 1/2 technical interview question and explain the ideal structured analyst answer using bullet points.';
    } else if (lower === '/resume') {
      promptToSend = 'Give me a 30-second bulleted recruiter briefing on Sambit Kumar Satapathy with key highlights, skills, and contact links.';
    }

    // Update history
    chatHistory.push({ role: 'user', content: promptToSend });
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...chatHistory
    ];

    try {
      const reply = await callGroq(messages);
      if (msgBody.contains(typing)) msgBody.removeChild(typing);

      if (reply && reply.trim()) {
        appendMessage(reply.trim(), 'bot', true);
        logChatToFirebase('bot', reply.trim());
        chatHistory.push({ role: 'assistant', content: reply.trim() });
        // Cap history to 20 messages (10 turns)
        if (chatHistory.length > 20) chatHistory.splice(0, 2);
      } else {
        appendMessage('No response received. Please try again.', 'bot');
        chatHistory.pop();
      }
    } catch (err) {
      if (msgBody.contains(typing)) msgBody.removeChild(typing);
      const msg = err.message.includes('429')
        ? '⏳ High traffic — please wait a moment before sending another message.'
        : `🌐 Connection error: ${err.message}`;
      appendMessage(msg, 'bot');
      chatHistory.pop();
    }

    sendBtn.disabled = false;
    input.focus();
  }

  // Event listeners
  sendBtn.addEventListener('click', () => sendMessage(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault(); 
      sendMessage(input.value); 
    }
  });

  chips.forEach(chip => {
    const handleChip = () => {
      const chipText = chip.getAttribute('data-prompt') || chip.textContent.trim();
      const mappedPrompt = CHIP_PROMPTS[chipText] || chipText;
      sendMessage(mappedPrompt);
    };
    chip.addEventListener('click', handleChip);
    chip.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleChip();
      }
    });
  });
}

// Bootstrap — Deferred to idle callback to preserve Core Web Vitals (LCP & TBT)
function bootstrapChatbot() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
  } else {
    initChatbot();
  }
}

if (typeof window !== 'undefined') {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(bootstrapChatbot, { timeout: 2500 });
  } else {
    window.addEventListener('load', bootstrapChatbot);
  }
}
