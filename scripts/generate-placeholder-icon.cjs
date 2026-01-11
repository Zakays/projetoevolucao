const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// 1x1 transparent PNG (tiny placeholder)
const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';
const buf = Buffer.from(base64, 'base64');

const files = ['icon-512.png', 'icon-192.png'];
files.forEach((f) => {
  const p = path.join(outDir, f);
  fs.writeFileSync(p, buf);
  console.log('Wrote', p);
});

console.log('\nPlaceholder icons generated in public/ (1x1 PNG). Replace with proper 192x192 and 512x512 PNGs for best results.');
