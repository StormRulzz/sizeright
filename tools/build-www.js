// Copy the web app into www/ for Capacitor. The repo root stays the GitHub Pages site.
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'www');
const FILES = ['index.html', 'style.css', 'calc.js', 'app.js', 'privacy.html', 'icons'];

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
for (const f of FILES) fs.cpSync(path.join(root, f), path.join(out, f), { recursive: true });
console.log('www/ ready:', FILES.join(', '));
