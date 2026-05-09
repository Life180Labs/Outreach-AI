const fs = require('fs');
const path = 'c:/Users/Pc/Documents/Life180/Projects/Outreach_AI/Logo/life180.png';
const buffer = fs.readFileSync(path);
const base64 = buffer.toString('base64');
console.log(`data:image/png;base64,${base64}`);
