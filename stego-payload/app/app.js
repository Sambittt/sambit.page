// Stego Payload Injector Logic
// Uses LSB (Least Significant Bit) steganography on the HTML5 Canvas

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

let currentMode = 'inject';
let loadedImage = null;
let maxCapacity = 0; // in bytes

// Elements - Inject
const dropInject = document.getElementById('drop-inject');
const fileInject = document.getElementById('file-inject');
const prevInject = document.getElementById('preview-inject');
const payloadInput = document.getElementById('payload-input');
const btnInject = document.getElementById('btn-inject');
const msgInject = document.getElementById('msg-inject');
const capacityStatus = document.getElementById('capacity-status');

// Elements - Extract
const dropExtract = document.getElementById('drop-extract');
const fileExtract = document.getElementById('file-extract');
const prevExtract = document.getElementById('preview-extract');
const payloadOutput = document.getElementById('payload-output');
const btnExtract = document.getElementById('btn-extract');
const msgExtract = document.getElementById('msg-extract');

// Tabs
function setMode(mode) {
  currentMode = mode;
  document.getElementById('tab-inject').classList.toggle('active', mode === 'inject');
  document.getElementById('tab-extract').classList.toggle('active', mode === 'extract');
  document.getElementById('panel-inject').style.display = mode === 'inject' ? 'block' : 'none';
  document.getElementById('panel-extract').style.display = mode === 'extract' ? 'block' : 'none';
}

function showMsg(id, type, text) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = `msg show ${type}`;
}

// ── File Handling ──

function handleImageLoad(e, mode) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      loadedImage = img;
      
      if (mode === 'inject') {
        prevInject.src = img.src;
        prevInject.style.display = 'block';
        dropInject.style.display = 'none';
        
        // Calculate capacity: (width * height * 3 color channels) / 8 bits
        maxCapacity = Math.floor((img.width * img.height * 3) / 8);
        capacityStatus.textContent = `Capacity: ${maxCapacity} bytes`;
        checkCapacity();
      } else {
        prevExtract.src = img.src;
        prevExtract.style.display = 'block';
        dropExtract.style.display = 'none';
        btnExtract.disabled = false;
        msgExtract.className = 'msg';
        payloadOutput.value = '';
      }
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

fileInject.addEventListener('change', (e) => handleImageLoad(e, 'inject'));
fileExtract.addEventListener('change', (e) => handleImageLoad(e, 'extract'));

// Dropzone drag/drop
[dropInject, dropExtract].forEach(drop => {
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('dragover'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('dragover'));
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    drop.classList.remove('dragover');
    const mode = drop.id === 'drop-inject' ? 'inject' : 'extract';
    const fileInput = mode === 'inject' ? fileInject : fileExtract;
    if (e.dataTransfer.files.length) {
      fileInput.files = e.dataTransfer.files;
      handleImageLoad({ target: fileInput }, mode);
    }
  });
});

// ── Encoding / Injecting ──

payloadInput.addEventListener('input', checkCapacity);

function checkCapacity() {
  if (!loadedImage) return;
  const bytes = new Blob([payloadInput.value]).size;
  if (bytes > maxCapacity - 4) { // Leave room for length header/terminator
    capacityStatus.style.color = 'var(--red)';
    btnInject.disabled = true;
    showMsg('msg-inject', 'err', `Payload too large! Limit: ${maxCapacity - 4} bytes.`);
  } else {
    capacityStatus.style.color = 'var(--dim)';
    btnInject.disabled = bytes === 0;
    msgInject.className = 'msg';
  }
}

// Convert string to binary string (8 bits per char)
function strToBin(str) {
  // Add a unique terminator: NULL char
  str += '\0';
  let bin = '';
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    // Handle UTF-8 safely by keeping it within standard ASCII/extended or using TextEncoder
    // For simplicity, we use 8-bit characters (charCodeAt)
    bin += charCode.toString(2).padStart(8, '0');
  }
  return bin;
}

btnInject.addEventListener('click', () => {
  if (!loadedImage || !payloadInput.value) return;

  const text = payloadInput.value;
  const binPayload = strToBin(text);

  canvas.width = loadedImage.width;
  canvas.height = loadedImage.height;
  ctx.drawImage(loadedImage, 0, 0);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  let bitIndex = 0;

  // LSB Injection
  for (let i = 0; i < data.length; i += 4) {
    if (bitIndex < binPayload.length) {
      // Inject into R, G, B channels (data[i], data[i+1], data[i+2])
      for (let j = 0; j < 3; j++) {
        if (bitIndex < binPayload.length) {
          const bit = parseInt(binPayload[bitIndex], 10);
          if (bit === 1) {
            data[i + j] |= 1; // Make odd
          } else {
            data[i + j] &= ~1; // Make even
          }
          bitIndex++;
        }
      }
    } else {
      break;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // Download
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'infected_image.png'; // Must be PNG to preserve LSB
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showMsg('msg-inject', 'ok', '✓ Payload injected successfully! Downloaded infected_image.png.');
  }, 'image/png');
});

// ── Decoding / Extracting ──

btnExtract.addEventListener('click', () => {
  if (!loadedImage) return;

  canvas.width = loadedImage.width;
  canvas.height = loadedImage.height;
  ctx.drawImage(loadedImage, 0, 0);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  let binStr = '';
  let extractedText = '';
  
  for (let i = 0; i < data.length; i += 4) {
    // Read R, G, B
    for (let j = 0; j < 3; j++) {
      binStr += (data[i + j] & 1).toString();
      
      if (binStr.length === 8) {
        const charCode = parseInt(binStr, 2);
        if (charCode === 0) {
          // Found terminator
          payloadOutput.value = extractedText;
          showMsg('msg-extract', 'ok', '✓ Payload successfully extracted!');
          return;
        }
        extractedText += String.fromCharCode(charCode);
        binStr = '';
      }
    }
  }

  // If loop finishes without finding NULL terminator, it might not be a valid stego image
  payloadOutput.value = extractedText;
  showMsg('msg-extract', 'err', '⚠ No valid terminator found. Image might not contain a payload or is corrupted.');
});
