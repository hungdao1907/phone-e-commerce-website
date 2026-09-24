const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'frontend/src');

function findAndReplace(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findAndReplace(filePath);
    } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let originalContent = content;

      // Replace single quoted string: 'http://localhost:3001/api/...' -> `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/...`
      content = content.replace(/'http:\/\/localhost:3001([^']*)'/g, "`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}$1`");

      // Replace template literals: `http://localhost:3001/api/...` -> `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/...`
      content = content.replace(/`http:\/\/localhost:3001([^`]*)`/g, "`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}$1`");

      // Replace double quoted strings: "http://localhost:3001/..." -> `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}...`
      content = content.replace(/"http:\/\/localhost:3001([^"]*)"/g, "`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}$1`");

      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
      }
    }
  });
}

findAndReplace(directoryPath);
console.log('Done replacing hardcoded URLs.');
