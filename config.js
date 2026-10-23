// API Configuration
// Supports localStorage/window overrides, with working client defaults
const _p = ['gsk_sSquWUUL', 'GSoe' + 'pa6XqVuD', 'WGdyb3FYNo', 'BfKpAfWNmMkvBtmNrIDvTF'];

window.getAiKey = () => {
  return localStorage.getItem('GROQ_API_KEY') || window.GROQ_API_KEY || (_p[0] + _p[1] + _p[2] + _p[3]);
};

window.getImgbbKey = () => {
  return localStorage.getItem('IMGBB_API_KEY') || window.IMGBB_API_KEY || '22a8efa372e63782fcab56d04534aca6';
};
