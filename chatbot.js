// Portfolio AI Agent - Powered by Gemini
const API_KEY = "AIzaSyA7IrZii5Y0tUMjdAr0z64jytItj9KwSBY"; // Will be restricted to sambit.page via Google Cloud
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

// System Prompt (The Brain)
const SYSTEM_PROMPT = `
You are the AI assistant for Sambit Satapathy, a BCA student specializing in Cybersecurity, ethical hacking, Linux, and network defense. 
Your goal is to explain his portfolio tools, talk about his skills, and help recruiters or visitors. 

Sambit's Skills: 
- Linux System Administration
- Network Security & Defense
- Python, Bash Scripting
- Web Development (HTML/CSS/JS, Firebase)

Sambit's Projects:
1. NetProbe: A Mini Security Operations Center (SOC) and OSINT Scanner built entirely in the browser using Vanilla JS and Firebase. It features DNS/WHOIS lookups, Shodan CVE detection, Risk Scoring, and PDF reporting.
2. ASCII Studio: Converts images into downloadable ASCII art.
3. Resume Builder: A sleek, dark-themed resume generator with export to PDF.
4. Font Animator: A tool to create glitchy, cyberpunk-style text animations.

Important details:
- All tools are 100% free and built from scratch without heavy frameworks like React/Next.js.
- Sambit is actively looking for internships and roles in Cybersecurity or Development.
- Contact: GitHub (Sambittt), Instagram, or Email.
- If someone asks to buy a coffee/donate, provide UPI ID: sambit22@upi

Guidelines:
- Keep your answers concise, friendly, and formatted nicely.
- Adopt a slight "dark terminal/hacker" persona, but remain professional.
- Use markdown formatting for code or emphasis.
`;

// Pre-defined questions
const SUGGESTIONS = [
  "What is this tool?",
  "Who is Sambit?",
  "What are Sambit's skills?",
  "Are you looking for internships?",
  "How can I contact Sambit?",
  "How did he build these tools?",
  "Show me other projects",
  "Are these tools free?",
  "Can I buy Sambit a coffee?"
];

let chatHistory = [];

function initChatbot() {
  // Inject HTML
  const container = document.createElement('div');
  container.innerHTML = `
    <!-- Floating Button -->
    <button class="ai-fab" id="ai-fab" aria-label="Open AI Assistant">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    </button>

    <!-- Chat Window -->
    <div class="ai-window" id="ai-window">
      <div class="ai-header">
        <div class="ai-title">// SAMBIT_AI </div>
        <button class="ai-close" id="ai-close">✕</button>
      </div>
      
      <div class="ai-body" id="ai-body">
        <div class="ai-msg bot">Hello! I'm Sambit's AI assistant. Ask me anything about him or the tools on this site!</div>
      </div>
      
      <div class="ai-options" id="ai-options">
        ${SUGGESTIONS.map(q => `<div class="ai-chip">${q}</div>`).join('')}
      </div>
      
      <div class="ai-input-area">
        <input type="text" class="ai-input" id="ai-input" placeholder="Ask anything..." autocomplete="off">
        <button class="ai-send" id="ai-send">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(container);

  // Elements
  const fab = document.getElementById('ai-fab');
  const win = document.getElementById('ai-window');
  const closeBtn = document.getElementById('ai-close');
  const input = document.getElementById('ai-input');
  const sendBtn = document.getElementById('ai-send');
  const body = document.getElementById('ai-body');
  const chips = document.querySelectorAll('.ai-chip');

  // Toggles
  fab.onclick = () => win.classList.add('open');
  closeBtn.onclick = () => win.classList.remove('open');

  // Auto-scroll
  const scrollToBottom = () => body.scrollTop = body.scrollHeight;

  // Add message to UI
  function appendMessage(text, sender, isHtml = false) {
    const el = document.createElement('div');
    el.className = `ai-msg ${sender}`;
    
    if (isHtml) {
      // Basic markdown to HTML (bold, newlines)
      let formatted = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
      formatted = formatted.replace(/\n/g, '<br/>');
      formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
      el.innerHTML = formatted;
    } else {
      el.textContent = text;
    }
    
    body.appendChild(el);
    scrollToBottom();
  }

  // Handle send
  async function sendMessage(text) {
    if (!text.trim()) return;
    
    // UI Updates
    appendMessage(text, 'user');
    input.value = '';
    sendBtn.disabled = true;
    
    // Add typing indicator
    const typingEl = document.createElement('div');
    typingEl.className = 'ai-msg bot typing';
    typingEl.textContent = 'Analyzing request...';
    body.appendChild(typingEl);
    scrollToBottom();

    // Prepare API Request Payload
    const currentUrl = window.location.href;
    const contextualPrompt = `System Context: ${SYSTEM_PROMPT}\n\nUser is currently viewing this URL: ${currentUrl}. If they ask "What is this tool?", explain the tool based on the URL.\n\nUser Message: ${text}`;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: contextualPrompt }] }]
        })
      });

      const data = await response.json();
      
      // Remove typing indicator
      body.removeChild(typingEl);

      if (data.candidates && data.candidates.length > 0) {
        const reply = data.candidates[0].content.parts[0].text;
        appendMessage(reply, 'bot', true);
      } else {
        appendMessage("Error: Could not generate a response. Please check API status.", 'bot');
      }
    } catch (err) {
      body.removeChild(typingEl);
      appendMessage("Connection error. The AI is offline.", 'bot');
    }

    sendBtn.disabled = false;
    input.focus();
  }

  // Listeners
  sendBtn.onclick = () => sendMessage(input.value);
  input.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(input.value); };
  
  chips.forEach(chip => {
    chip.onclick = () => sendMessage(chip.textContent);
  });
}

// Inject on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChatbot);
} else {
  initChatbot();
}
