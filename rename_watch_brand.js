const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/Tablet/g, 'WatchBrand');
  content = content.replace(/tablet/g, 'watch');
  // Specific fixes
  content = content.replace(/WatchBrandBrand/g, 'WatchBrand'); 
  fs.writeFileSync(filePath, content);
}

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.includes(' 2') || file.includes(' 3')) {
      fs.rmSync(path.join(dir, file), { recursive: true, force: true });
      continue;
    }
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else {
      let newName = file.replace(/Tablet/g, 'WatchBrand');
      newName = newName.replace(/tablet/g, 'watch');
      const newPath = path.join(dir, newName);
      if (fullPath !== newPath) {
        fs.renameSync(fullPath, newPath);
      }
      replaceInFile(newPath);
    }
  }
}

processDir('frontend/src/pages/watch/brand');
