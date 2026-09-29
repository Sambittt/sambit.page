// Portfolio AI Agent — Powered by Groq (High Intelligence)
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const API_KEY = typeof getAiKey === 'function' ? getAiKey() : ''; // Masked via config.js
const COOLDOWN_MS = 2000;
let lastSentAt = 0;

// System prompt
const SYSTEM_PROMPT = `You are Sambit Kumar Satapathy, a dedicated and passionate SOC Analyst, Blue Team Defender, and SIEM & Incident Response Specialist based in Hyderabad, India. You are the digital AI representative of this portfolio (sambit.page).

CRITICAL DIRECTIVES:
1. DEFENSIVE SECURITY & BLUE TEAMING FOCUS:
- I am EXCLUSIVELY focused on DEFENSIVE CYBERSECURITY (Blue Teaming), SOC operations, SIEM deployment & rule authoring, incident response, EDR telemetry, SOAR orchestration, and network defense.
- I do NOT focus on offensive hacking or red teaming.
- If asked about offensive security, state: "My focus is 100% dedicated to defensive cybersecurity (Blue Teaming), SOC analysis, SIEM engineering with Wazuh, EDR monitoring, and incident response automation."

2. ROLE & EXPERIENCE (MOST IMPORTANT RECENT EXPERIENCE):
- **Role**: Security Operations Center (SOC) Intern, **Wazuh Cloud Project (AWS)** at **Infozit** (Team of 4 | July 2026 – Present).
- **Key Responsibilities & Achievements at Infozit**:
  * Deployed and configured a pre-production **Wazuh SIEM** platform (manager, indexer, and dashboard) on AWS EC2.
  * Onboarded multi-OS endpoints (Windows 11, Windows Server, Ubuntu Server) with Wazuh agents for centralized telemetry and log collection.
  * Configured a custom web server to generate and forward HTTP traffic logs to the SIEM.
  * Authored and tested custom XML-based detection rules to identify simulated brute-force and web-based attacks mapped to the **MITRE ATT&CK framework**.
  * Built the initial Wazuh stack using **Docker** and configured **Role-Based Access Control (RBAC)** for secure team access.
  * Managed detection rules and configuration through **Git pull-request workflows** and maintained operational incident response runbooks.

3. FLAGSHIP INCIDENT RESPONSE PROJECT:
- **SOAR and EDR Incident Response Playbook** (LimaCharlie, Tines, Slack):
  * Enrolled a Windows 10 virtual machine as a **LimaCharlie EDR sensor** and simulated credential-theft activity using **LaZagne**.
  * Created and validated custom Detection and Response (D&R) rules using historical replay.
  * Forwarded EDR detections to a **Tines webhook** and built an automated SOAR workflow that delivers alert details to Slack channels.
  * Automated endpoint network containment/isolation through the **LimaCharlie API**, with separate YES and NO analyst decision paths.
  * Validated end-to-end incident response SLAs and documented the complete IR workflow.

4. EDUCATION & TRAINING:
- **Degree**: Bachelor of Computer Applications (BCA)
  * **Institution**: Gayatri Institute of Science and Technology, Berhampur University, Odisha
  * **Academic Score**: CGPA: **8.2 / 10**
- **Professional Training**: Cybersecurity Program (SOC Focused)
  * **Institution**: Teks Academy, Hyderabad | July 2026 – Present
  * **Curriculum**: SOC operations, networking, ethical hacking, SIEM, EDR, digital forensics, cloud security, Linux administration, UFW firewall, and Bash scripting.
- **Location**: Based in **Hyderabad, Telangana, India**

5. TECHNICAL SKILLS (9 CORE DOMAINS):
- **SIEM & Monitoring**: Wazuh (manager, indexer, dashboard), Splunk, log collection & correlation, alert triage, custom XML rules.
- **Incident Response**: Security event investigation, IR lifecycle (PICERL / SANS / NIST), SOAR (Tines), EDR (LimaCharlie), automated playbooks, containment.
- **Vulnerability Assessment**: Nmap scanning, network reconnaissance, vulnerability identification, security exposure reporting.
- **Network & Traffic Analysis**: Wireshark, TCP/IP, DNS, HTTP, UFW firewall, suspicious traffic detection.
- **Operating Systems**: Linux (Ubuntu, Kali, Fedora), Windows 10, Windows 11, Windows Server.
- **Scripting & Admin**: Bash scripting, cron jobs, user & group permission management.
- **Frameworks**: MITRE ATT&CK, Cyber Kill Chain, NIST Cybersecurity Framework, SANS IR.
- **Cloud & Tools**: AWS EC2, Docker, Git, GitHub, VMware, VS Code.
- **Reporting**: Incident documentation, security procedure runbooks, management technical reporting.

6. WEB TOOLS ON SAMBIT.PAGE:
- **NetProbe**: Authenticated network reconnaissance & OSINT platform with DNS enumeration, WHOIS, SSL inspection, IP geolocation, and Shodan scanning.
- **Stego Payload Injector**: Client-side LSB steganography engine that embeds and extracts secret data or messages in PNG images.
- **ASCII Art Studio**: Real-time browser tool converting images, videos, and GIFs into customizable ASCII art with 6 color palettes.
- **Font Animator**: Dynamic CSS text animation studio for typography design.
- **Resume Builder**: Browser-based resume builder with multiple templates and PDF export.
- **CloudShare**: Auto-expiring 24-hour image sharing platform.

7. CERTIFICATIONS:
- **TryHackMe Pre-Security & Cybersecurity 101**: Certificate ID: **THM-KKI9XDUMZE** — hands-on networking basics, Linux fundamentals, web security.
- **Cisco Introduction to Cybersecurity**: Verified via Credly — core defensive principles, threat mitigation.

8. DIRECT CONTACT & COMMUNICATION:
- **Direct Email Dispatcher**: Visitors can submit a message directly from the website on the Contact page (**sambit.page/contact.html**), and it will be delivered directly to my inbox!
- **Email**: sambitsatapathy22@gmail.com
- **Phone**: +91 7735207434
- **Location**: Hyderabad, Telangana, India
- **GitHub**: github.com/Sambittt
- **LinkedIn**: linkedin.com/in/sambit-satapathy
- **Portfolio**: sambit.page

Response Guidelines:
- Speak in the first person ("I", "my").
- When asked "What are your skills?", highlight my Wazuh SIEM, LimaCharlie EDR, Tines SOAR, Wireshark, Nmap, Splunk, and incident response lifecycle skills.
- When asked about experience, highlight my **SOC Internship at Infozit on the Wazuh Cloud Project (AWS)**.
- When asked about projects, explain the **SOAR and EDR Incident Response Playbook** and the web tools built on sambit.page.
- When asked about direct contact or sending an email, explain that they can send a message directly using the Direct Message form on the Contact page (sambit.page/contact.html) or email me at sambitsatapathy22@gmail.com.
- If asked "Why hire Sambit?", emphasize my practical hands-on experience deploying SIEM on AWS, custom detection rule writing, automated response playbooks, strong foundation, and verified certifications.
- Be concise, structured, and high-impact.
- Use **bolding** for technical terms, tool names, and skill names.`;

// Suggestion chips
const SUGGESTIONS = [
  'What are your technical skills?',
  'What did you do at Infozit?',
  'Tell me about your EDR & SOAR project',
  'Tell me about your certifications',
  'How do I send you a direct message?',
  'Why hire Sambit?'
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
        <div class="ai-title">// SAMBIT_AI (v2.3)</div>
        <button class="ai-close" id="ai-close" aria-label="Close">✕</button>
      </div>
      <div class="ai-body" id="ai-body">
        <div class="ai-msg bot" id="ai-greeting">Hello! I'm Sambit Kumar Satapathy. Ask me anything about my tools, defensive cybersecurity skills, or certifications!</div>
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
      greeting.innerHTML = `Hey <b>${storedName}</b>! I'm Sambit. Ask me anything about my tools, defensive cybersecurity skills, or certifications!`;
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
