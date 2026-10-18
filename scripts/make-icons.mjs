// Generates placeholder PWA icons and the Open Graph image (replace with the real logo, Q-013).
import sharp from 'sharp'
const mark = (size, pad) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${pad ? 0 : 96}" fill="#b3201f"/>
  <text x="256" y="${pad ? 300 : 310}" font-family="Arial Narrow, Arial, sans-serif" font-weight="700" font-size="${pad ? 150 : 190}" text-anchor="middle" fill="#fbf6ec">JEFF'S</text>
  <text x="256" y="${pad ? 370 : 400}" font-family="Arial, sans-serif" font-weight="700" font-size="${pad ? 44 : 56}" text-anchor="middle" fill="#f2c14e">BEER • WINGS</text>
</svg>`
await sharp(Buffer.from(mark(192))).resize(192, 192).png().toFile('public/icons/icon-192.png')
await sharp(Buffer.from(mark(512))).png().toFile('public/icons/icon-512.png')
await sharp(Buffer.from(mark(512, true))).png().toFile('public/icons/maskable-512.png')
await sharp(Buffer.from(mark(64))).resize(48, 48).png().toFile('public/favicon.ico')
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#1e1b18"/><rect y="470" width="1200" height="160" fill="#b3201f"/>
  <text x="80" y="230" font-family="Arial Narrow, Arial, sans-serif" font-weight="700" font-size="110" fill="#fbf6ec">JEFF'S TAPROOM &amp; GRILL</text>
  <text x="80" y="340" font-family="Arial, sans-serif" font-size="56" fill="#f2c14e">Beer • Wings • Bridgeville, DE</text>
  <text x="80" y="570" font-family="Arial, sans-serif" font-weight="700" font-size="52" fill="#fff">Order pickup online</text>
</svg>`
await sharp(Buffer.from(og)).png().toFile('public/og.png')
console.log('icons written')
