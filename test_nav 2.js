const fs = require('fs');
const content = fs.readFileSync('frontend/src/components/layout/GlobalNav.tsx', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('title = \'THƯƠNG HIỆU / DÒNG MÁY\';'));
console.log(lines.slice(start, start + 30).join('\n'));
