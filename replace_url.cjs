const fs = require('fs');
const path = require('path');

function replaceInFiles(dir, search, replace) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInFiles(fullPath, search, replace);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes(search)) {
        content = content.replace(new RegExp(search, 'g'), replace);
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated', fullPath);
      }
    }
  }
}

replaceInFiles('./src', 'http://localhost:3000', 'https://softinsa-api-riya.onrender.com');
console.log('Replacement complete.');
