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
  let originalContent = content;

  // Regex to fix specific button text colors
  const regex = /(bg-primary|bg-blue-600|bg-\[#[0-9a-fA-F]+\]|bg-red-500)[^"]*text-main/g;
  content = content.replace(regex, (match) => {
    return match.replace('text-main', 'text-white');
  });

  const regex2 = /text-main([^"]*(?:bg-primary|bg-blue-600|bg-\[#[0-9a-fA-F]+\]|bg-red-500))/g;
  content = content.replace(regex2, (match) => {
    return match.replace('text-main', 'text-white');
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log('Fixed buttons in ' + file);
  }
});
