const fs = require('fs');
let text = fs.readFileSync('vite_error.txt', 'utf16le');
text = text.replace(/\0/g, '');
fs.writeFileSync('vite_error_utf8.txt', text, 'utf8');
