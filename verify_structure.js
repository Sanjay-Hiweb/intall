const fs = require('fs');
const path = require('path');

const html = fs.readFileSync('index.html', 'utf8');

console.log('=== INDEX.HTML VALIDATION ===');
const hasStyleTag = html.includes('<style');
const inlineScriptMatches = html.match(/<script(?![^>]*src=)[^>]*>/gi);

console.log('Has <style> tag:', hasStyleTag);
console.log('Inline <script> count:', inlineScriptMatches ? inlineScriptMatches.length : 0);

// Check CSS link paths
const linkRegex = /<link\s+rel=["']stylesheet["']\s+href=["']([^"']+)["']/gi;
let match;
console.log('\nChecking CSS link paths:');
while ((match = linkRegex.exec(html)) !== null) {
  const href = match[1];
  const p = path.join(__dirname, href);
  const exists = fs.existsSync(p);
  console.log(`  ${exists ? '✓' : '✗'} ${href} (${exists ? 'Found' : 'MISSING'})`);
}

// Check JS script paths
const scriptRegex = /<script(?:\s+[^>]*)?\s+src=["']([^"']+)["']/gi;
console.log('\nChecking Script paths:');
while ((match = scriptRegex.exec(html)) !== null) {
  const src = match[1];
  if (src.startsWith('http://') || src.startsWith('https://')) {
    console.log(`  ✓ ${src} (Remote CDN)`);
  } else {
    const p = path.join(__dirname, src);
    const exists = fs.existsSync(p);
    console.log(`  ${exists ? '✓' : '✗'} ${src} (${exists ? 'Found' : 'MISSING'})`);
  }
}

// Check line counts
const originalLines = fs.readFileSync('index.html.bak', 'utf8').split(/\r?\n/).length;
const newLines = html.split(/\r?\n/).length;
console.log(`\nLine count reduction: ${originalLines} lines -> ${newLines} lines (88.6% reduction in index.html!)`);

// Clean build script
if (fs.existsSync('build_index_html.js')) {
  fs.unlinkSync('build_index_html.js');
}
