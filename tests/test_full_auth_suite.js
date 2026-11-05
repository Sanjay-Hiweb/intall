// tests/test_full_auth_suite.js — End-to-End Verification of Access Gate, Password Criteria, Admin Telemetry & SQLite
const assert = require('node:assert');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

// Test port (8001 so it doesn't conflict with any active server on 8000)
process.env.PORT = '8001';
process.env.NODE_ENV = 'development';

console.log('🚀 Launching INTALL server test instance...');
require('../server.js');

function httpRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runSuite() {
  await sleep(1000); // Allow server to bind
  console.log('--- STARTING COMPREHENSIVE VERIFICATION SUITE ---\n');

  // Test 1: Verify home.html has NO "Stage 1", "Stage 2", "Stage 3" text
  console.log('[Test 1] Checking home.html for removal of awkward Stage text...');
  const homeHtml = fs.readFileSync(path.join(__dirname, '..', 'home.html'), 'utf8');
  assert.strictEqual(/stage\s*[123]/i.test(homeHtml), false, 'home.html must not contain Stage 1, Stage 2, or Stage 3');
  console.log('  ✓ Verified: "Stage 1", "Stage 2", and "Stage 3" text completely removed.\n');

  // Test 2: Unauthenticated access to root / -> Must redirect to /signin
  console.log('[Test 2] Verifying access barrier on root /...');
  const rootRes = await httpRequest({
    hostname: '127.0.0.1',
    port: 8001,
    path: '/',
    method: 'GET'
  });
  assert.strictEqual(rootRes.statusCode, 302, 'Root / must return 302 redirect for unauthenticated users');
  assert.ok(rootRes.headers.location.includes('/signin'), 'Redirect must point to /signin');
  console.log('  ✓ Verified: Root / immediately redirects unauthenticated users to /signin.\n');

  // Test 3: Unauthenticated access to /index.html (3D viewpoint) -> Must redirect to /signin
  console.log('[Test 3] Verifying access barrier on 3D viewpoint (/index.html)...');
  const studioRes = await httpRequest({
    hostname: '127.0.0.1',
    port: 8001,
    path: '/index.html',
    method: 'GET'
  });
  assert.strictEqual(studioRes.statusCode, 302, '3D viewpoint /index.html must return 302 redirect when not logged in');
  assert.ok(studioRes.headers.location.includes('/signin'), 'Redirect must point to /signin');
  console.log('  ✓ Verified: 3D viewpoint NEVER shown without login.\n');

  // Test 4: Signin page (/signin) -> Must be accessible
  console.log('[Test 4] Verifying /signin interface availability...');
  const signinRes = await httpRequest({
    hostname: '127.0.0.1',
    port: 8001,
    path: '/signin',
    method: 'GET'
  });
  assert.strictEqual(signinRes.statusCode, 200, '/signin must return 200 OK');
  assert.ok(signinRes.body.includes('googleAuthBtn'), 'Must show Google login button');
  assert.ok(signinRes.body.includes('signUpForm'), 'Must show Sign Up form');
  assert.ok(signinRes.body.includes('MANDATORY PASSWORD CRITERIA'), 'Must show password criteria checklist');
  console.log('  ✓ Verified: Sign-in / Sign-up interface is fully available.\n');

  // Test 5: Register with weak passwords -> Must reject
  console.log('[Test 5] Verifying rejection of weak passwords during signup...');
  const weakPasswords = [
    'short',              // too short
    'alllowercase12!@',   // no uppercase
    'ALLUPPERCASE12!@',   // no lowercase
    'OnlyOneNumber1!Aa',  // only 1 number
    'NoSpecialChar12Aa'   // no special character
  ];

  for (const pw of weakPasswords) {
    const regWeakRes = await httpRequest({
      hostname: '127.0.0.1',
      port: 8001,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: `user_${Date.now()}@gmail.com`,
      password: pw,
      name: 'Test Weak'
    });
    assert.strictEqual(regWeakRes.statusCode, 400, `Password "${pw}" must be rejected with 400 Bad Request`);
    const json = JSON.parse(regWeakRes.body);
    assert.ok(json.error, 'Must provide descriptive error');
  }
  console.log('  ✓ Verified: Weak passwords rejected across all security rules.\n');

  // Test 6: Register with strong password -> Must approve and create SQLite record & session
  console.log('[Test 6] Registering user with strong password...');
  const testEmail = `architect_${Date.now()}@gmail.com`;
  const strongPassword = 'Strong#Password2026!';
  const regRes = await httpRequest({
    hostname: '127.0.0.1',
    port: 8001,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: testEmail,
    password: strongPassword,
    name: 'Sanjay Chief Architect'
  });

  assert.strictEqual(regRes.statusCode, 200, 'Strong password must register successfully with 200 OK');
  const regJson = JSON.parse(regRes.body);
  assert.strictEqual(regJson.success, true);
  assert.strictEqual(regJson.user.email, testEmail);

  // Extract session cookie
  const cookieHeader = regRes.headers['set-cookie'];
  assert.ok(cookieHeader && cookieHeader.length > 0, 'Must set session cookie');
  const sessionCookie = cookieHeader[0].split(';')[0];
  console.log('  ✓ Verified: User registered with strong password and session cookie issued.\n');

  // Test 7: Log in with local email & password
  console.log('[Test 7] Verifying login with email & password...');
  const loginRes = await httpRequest({
    hostname: '127.0.0.1',
    port: 8001,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: testEmail,
    password: strongPassword
  });
  assert.strictEqual(loginRes.statusCode, 200);
  const loginJson = JSON.parse(loginRes.body);
  assert.strictEqual(loginJson.success, true);
  console.log('  ✓ Verified: User logged in successfully.\n');

  // Test 8: With session cookie, accessing 3D viewpoint (/index.html) -> Must succeed with 200
  console.log('[Test 8] Accessing 3D viewpoint with authenticated session...');
  const authedStudioRes = await httpRequest({
    hostname: '127.0.0.1',
    port: 8001,
    path: '/index.html',
    method: 'GET',
    headers: { 'Cookie': sessionCookie }
  });
  assert.strictEqual(authedStudioRes.statusCode, 200, 'Authenticated user must receive 200 OK for /index.html');
  assert.ok(authedStudioRes.body.includes('INTALL'), 'Must deliver 3D CAD application');
  console.log('  ✓ Verified: 3D viewpoint accessible when logged in.\n');

  // Test 9: Admin Telemetry & Metrics
  console.log('[Test 9] Querying Admin Telemetry & Metrics API (/api/admin/metrics)...');
  const metricsRes = await httpRequest({
    hostname: '127.0.0.1',
    port: 8001,
    path: '/api/admin/metrics',
    method: 'GET',
    headers: { 'Cookie': sessionCookie }
  });
  assert.strictEqual(metricsRes.statusCode, 200, 'Admin metrics must return 200 OK');
  const metricsJson = JSON.parse(metricsRes.body);
  assert.ok(typeof metricsJson.totalViews === 'number', 'Must report totalViews');
  assert.ok(typeof metricsJson.totalVisits === 'number', 'Must report totalVisits');
  assert.ok(typeof metricsJson.totalLogins === 'number', 'Must report totalLogins');
  assert.ok(typeof metricsJson.totalSignups === 'number', 'Must report totalSignups');
  assert.ok(Array.isArray(metricsJson.activeSessions), 'Must list activeSessions (who is logged in)');
  assert.ok(metricsJson.activeSessions.some(s => s.email === testEmail), 'Currently logged-in user must be listed');
  console.log('  ✓ Verified: Admin metrics shows who is logged in and live counts:', {
    views: metricsJson.totalViews,
    visits: metricsJson.totalVisits,
    logins: metricsJson.totalLogins,
    signups: metricsJson.totalSignups,
    activeSessions: metricsJson.activeSessionsCount
  });

  // Test 10: Admin Dashboard page (/admin)
  console.log('\n[Test 10] Fetching Admin Dashboard HTML (/admin)...');
  const adminPageRes = await httpRequest({
    hostname: '127.0.0.1',
    port: 8001,
    path: '/admin',
    method: 'GET',
    headers: { 'Cookie': sessionCookie }
  });
  assert.strictEqual(adminPageRes.statusCode, 200);
  assert.ok(adminPageRes.body.includes('INTALL Studio Telemetry'), 'Must deliver Admin panel');
  console.log('  ✓ Verified: Admin Dashboard HTML delivered successfully.\n');

  console.log('===============================================================');
  console.log('🎉 ALL 10 ACCEPTANCE TESTS PASSED WITHOUT ERRORS!');
  console.log('===============================================================');
  process.exit(0);
}

runSuite().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
