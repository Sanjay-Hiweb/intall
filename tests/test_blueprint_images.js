const http = require('http');
const assert = require('assert');

function fetchUrl(path, cookie) {
  return new Promise((resolve, reject) => {
    const headers = cookie ? { 'Cookie': cookie } : {};
    http.get(`http://localhost:8000${path}`, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    }).on('error', reject);
  });
}

function postJson(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request(`http://localhost:8000${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const cookie = res.headers['set-cookie'] ? res.headers['set-cookie'][0].split(';')[0] : null;
        resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(body || '{}'), cookie });
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('--- 1. Testing image asset serving ---');
  const imgRes = await fetchUrl('/assets/blueprint-elevation.jpg');
  console.log('Status /assets/blueprint-elevation.jpg:', imgRes.status, 'Type:', imgRes.headers['content-type']);
  assert.strictEqual(imgRes.status, 200);
  assert.strictEqual(imgRes.headers['content-type'], 'image/jpeg');

  console.log('--- 2. Registering and logging in with strong password ---');
  const testEmail = `blueprint_tester_${Date.now()}@gmail.com`;
  const regRes = await postJson('/api/auth/register', {
    email: testEmail,
    password: 'Strong#Password2026!',
    name: 'Blueprint Tester'
  });
  console.log('Registration status:', regRes.status, 'Cookie:', regRes.cookie);
  const cookie = regRes.cookie;

  console.log('--- 3. Testing home.html gallery blueprint cards ---');
  const homeRes = await fetchUrl('/home.html', cookie);
  console.log('home.html status:', homeRes.status);
  assert.strictEqual(homeRes.status, 200);
  assert.ok(homeRes.body.includes('3BHK Standard Grand Family'), 'Should contain 3BHK Standard Grand Family');
  assert.ok(homeRes.body.includes('3BHK Vastu Sanctum with Pooja'), 'Should contain 3BHK Vastu Sanctum with Pooja');
  assert.ok(homeRes.body.includes('3BHK Southern Haven'), 'Should contain 3BHK Southern Haven');
  assert.ok(homeRes.body.includes('3BHK Executive Home with Study'), 'Should contain 3BHK Executive Home with Study');
  assert.ok(homeRes.body.includes('3BHK Courtyard Narrow'), 'Should contain 3BHK Courtyard Narrow');
  assert.ok(homeRes.body.includes('3BHK Wide-Frontage Villa'), 'Should contain 3BHK Wide-Frontage Villa');
  assert.ok(homeRes.body.includes('assets/blueprint-elevation.jpg'), 'Should reference assets/blueprint-elevation.jpg');

  console.log('--- 3. Testing templates.js image property ---');
  const { TEMPLATES, getBlueprintImage } = require('../templates.js');
  console.log('Loaded templates count:', TEMPLATES.length);
  const t08 = TEMPLATES.find(t => t.name === '3BHK Standard Grand Family');
  assert.ok(t08, 't08 should exist');
  assert.strictEqual(t08.image, 'assets/blueprint-elevation.jpg');
  console.log('t08 image:', t08.image);

  const fallback = getBlueprintImage({ name: 'Unnamed Blueprint' });
  assert.strictEqual(fallback, 'assets/blueprint-elevation.jpg');
  console.log('Fallback image test passed:', fallback);

  console.log('--- 4. Checking matching-engine.js code ---');
  const fs = require('fs');
  const me = fs.readFileSync('js/components/matching-engine.js', 'utf8');
  assert.ok(me.includes('candImgSrc'), 'matching-engine.js should define candImgSrc');
  assert.ok(me.includes('candidate-thumb-img'), 'matching-engine.js should render candidate-thumb-img');
  assert.ok(me.includes('assets/blueprint-elevation.jpg'), 'matching-engine.js should fallback to assets/blueprint-elevation.jpg');
  assert.ok(me.includes('toggleCandidateThumb'), 'matching-engine.js should provide toggleCandidateThumb');

  console.log('ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
