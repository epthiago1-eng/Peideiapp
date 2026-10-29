const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(width, height, getPixel) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }
  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type);
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crcVal, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const idatData = zlib.deflateSync(rawData);
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idatData),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

// Generate gradient: #0a84ff (10, 132, 255) to #5e5ce6 (94, 92, 230) to #bf5af2 (191, 90, 242)
function getGradientColor(t) {
  let r, g, b;
  if (t < 0.6) {
    const u = t / 0.6;
    r = Math.round(10 + u * (94 - 10));
    g = Math.round(132 + u * (92 - 132));
    b = Math.round(255 + u * (230 - 255));
  } else {
    const u = (t - 0.6) / 0.6;
    r = Math.round(94 + u * (191 - 94));
    g = Math.round(92 + u * (90 - 92));
    b = Math.round(230 + u * (242 - 230));
  }
  return [r, g, b];
}

// Distance to rounded rectangle
function sdRoundedRect(x, y, w, h, r) {
  const qx = Math.abs(x) - w + r;
  const qy = Math.abs(y) - h + r;
  const outside = Math.sqrt(Math.max(qx, 0) ** 2 + Math.max(qy, 0) ** 2);
  const inside = Math.min(Math.max(qx, qy), 0);
  return outside + inside - r;
}

function makePixelGetter(isMaskable) {
  return function(x, y, w, h) {
    const nx = x / w;
    const ny = y / h;
    const t = (nx + ny) / 2;
    const [bgR, bgG, bgB] = getGradientColor(t);

    if (isMaskable) {
      // Full bleed gradient with subtle center design
      return [bgR, bgG, bgB, 255];
    }

    // Rounded squircle (like iOS icon)
    const cx = x - w / 2;
    const cy = y - h / 2;
    const pad = w * 0.05;
    const radius = w * 0.22;
    const dist = sdRoundedRect(cx, cy, (w / 2) - pad, (h / 2) - pad, radius);

    if (dist > 1) {
      return [0, 0, 0, 0]; // Transparent
    }
    const alpha = dist <= 0 ? 1 : (1 - dist);
    
    // Add decorative subtle white circle in top right
    const dcx = x - (w * 0.85);
    const dcy = y - (h * 0.15);
    const circleDist = Math.sqrt(dcx*dcx + dcy*dcy);
    let r = bgR;
    let g = bgG;
    let b = bgB;
    if (circleDist < w * 0.35) {
      const shine = 0.15 * (1 - circleDist / (w * 0.35));
      r = Math.min(255, Math.round(r + (255 - r) * shine));
      g = Math.min(255, Math.round(g + (255 - g) * shine));
      b = Math.min(255, Math.round(b + (255 - b) * shine));
    }

    return [r, g, b, Math.round(alpha * 255)];
  };
}

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192, makePixelGetter(false)));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512, makePixelGetter(false)));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, makePixelGetter(true)));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, makePixelGetter(false)));

console.log('Generated PWA and Apple Touch icons successfully.');
