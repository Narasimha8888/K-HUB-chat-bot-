const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(getFiles(file));
    } else if (file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = getFiles('c:/Studymode Ai/frontend/src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  const regex = /className="[^"]*(?:bg-primary|bg-red-500|bg-\[#[0-9a-fA-F]+\])[^"]*text-main[^"]*"/g;
  
  content = content.replace(regex, (match) => {
    changed = true;
    return match.replace('text-main', 'text-white');
  });

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Fixed buttons in ' + file);
  }
});
