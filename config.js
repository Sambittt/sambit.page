// API Configuration
// Security Best Practice: Never commit private production API keys to source control.
// Keys can be configured in your browser session via localStorage:
// - localStorage.setItem('GROQ_API_KEY', 'your_groq_api_key')
// - localStorage.setItem('IMGBB_API_KEY', 'your_imgbb_api_key')

window.getAiKey = () => {
  return localStorage.getItem('GROQ_API_KEY') || window.GROQ_API_KEY || '';
};

window.getImgbbKey = () => {
  return localStorage.getItem('IMGBB_API_KEY') || window.IMGBB_API_KEY || '';
};
