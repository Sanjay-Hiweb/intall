// test_auth_suite.js — Comprehensive verification suite for INTALL Sign-In and Route Protection
const http = require('node:http');
const assert = require('node:assert');

const BASE_URL = 'http://localhost:8000';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(url, reqOptions, (res) => {
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
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runAuthTests() {
  console.log('===============================================================');
  console.log('🏛️  INTALL AUTHENTICATION & ROUTE PROTECTION VERIFICATION SUITE');
  console.log('===============================================================');

  // Test 1: Sign-In Page Serves Correctly
  console.log('\n[1/8] Checking Sign-In page availability (/signin)...');
  const signinRes = await request('/signin');
  assert.strictEqual(signinRes.statusCode, 200, 'Sign-In page must return 200 OK');
  assert(signinRes.body.includes('Sign in to your <em>drawing board.</em>'), 'Headline must match requirement');
  assert(signinRes.body.includes('Continue with Google'), 'Primary Google button must be present');
  assert(signinRes.body.includes('SHEET 01 / ACCESS'), 'SVG caption must be present');
  assert(signinRes.body.includes('SHEET 00, REV A'), 'Title block stamp must be present');
  assert(!signinRes.body.includes('backdrop-filter: blur'), 'Glassmorphism must not be present');
  console.log('   ✓ Sign-In HTML conforms to Drafting Table specification and content requirements');

  // Test 2: Protected Studio Route (/index.html)
  console.log('\n[2/8] Testing unauthenticated route protection (/index.html)...');
  const indexRes = await request('/index.html');
  assert.strictEqual(indexRes.statusCode, 302, 'Unauthenticated user must be redirected (HTTP 302)');
  assert.strictEqual(indexRes.headers.location, '/signin?next=/index.html', 'Redirect must point to /signin?next=/index.html');
  console.log(`   ✓ Protected route correctly intercepted. Redirect: ${indexRes.headers.location}`);

  // Test 3: Open-Redirect Attack Prevention
  console.log('\n[3/8] Testing open-redirect attack vectors (?next=//evil.com)...');
  const evilTargets = [
    '//evil.com',
    'https://phishing-cad.com',
    '/\\evil.com',
    'javascript:alert(1)',
    '//google.com/malicious'
  ];
  for (const target of evilTargets) {
    const res = await request(`/auth/google?returnTo=${encodeURIComponent(target)}`);
    assert.strictEqual(res.statusCode, 302, 'Initiator should redirect to Google OAuth URL');
    const redirectUrl = new URL(res.headers.location);
    const stateEncoded = redirectUrl.searchParams.get('state');
    const stateObj = JSON.parse(Buffer.from(stateEncoded, 'base64url').toString('utf8'));
    assert.strictEqual(stateObj.returnTo, '/index.html', `Target "${target}" must be neutralized to /index.html`);
  }
  console.log('   ✓ All 5 open-redirect attack vectors safely neutralized to safe internal targets');

  // Test 4: Server-Side ID Token Verification Endpoint Security
  console.log('\n[4/8] Testing server-side ID token verification (/api/auth/google/verify)...');
  const badTokenRes = await request('/api/auth/google/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { credential: 'forged_or_malformed_jwt_token' }
  });
  assert.strictEqual(badTokenRes.statusCode, 401, 'Forged ID token must be rejected with 401');
  const badTokenJson = JSON.parse(badTokenRes.body);
  assert(badTokenJson.error, 'Must provide an error explanation');
  console.log(`   ✓ Forged/invalid ID token rejected securely: "${badTokenJson.error}"`);

  // Test 5: Account Deletion Endpoint Protection (CSRF & Auth Check)
  console.log('\n[5/8] Testing account deletion endpoint (/api/auth/delete-account)...');
  const unauthDelete = await request('/api/auth/delete-account', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  assert.strictEqual(unauthDelete.statusCode, 401, 'Unauthenticated account deletion must return 401');
  console.log('   ✓ Unauthenticated delete request blocked');

  // Test 6: Legal Placeholders Accessibility (/terms & /privacy)
  console.log('\n[6/8] Verifying Terms of Service & Privacy Policy endpoints...');
  const termsRes = await request('/terms');
  assert.strictEqual(termsRes.statusCode, 200, 'Terms must return 200');
  assert(termsRes.body.includes('[REPLACE WITH REAL POLICY]'), 'Terms must have placeholder tag');

  const privacyRes = await request('/privacy');
  assert.strictEqual(privacyRes.statusCode, 200, 'Privacy must return 200');
  assert(privacyRes.body.includes('[REPLACE WITH REAL POLICY]'), 'Privacy must have placeholder tag');
  console.log('   ✓ Terms & Privacy pages served with required [REPLACE WITH REAL POLICY] notices');

  // Test 7: Public Auth Config Endpoint
  console.log('\n[7/8] Testing auth configuration endpoint (/api/auth/config)...');
  const configRes = await request('/api/auth/config');
  assert.strictEqual(configRes.statusCode, 200, 'Config must return 200');
  const configJson = JSON.parse(configRes.body);
  assert(configJson.clientId, 'Must return client ID');
  assert(configJson.redirectUri, 'Must return redirect URI');
  console.log(`   ✓ Config returned public Client ID: ${configJson.clientId.slice(0, 16)}...`);

  // Test 8: Logout Endpoint
  console.log('\n[8/8] Testing logout endpoint (/auth/logout)...');
  const logoutRes = await request('/auth/logout');
  assert.strictEqual(logoutRes.statusCode, 302, 'Logout must redirect');
  assert(logoutRes.headers['set-cookie'], 'Must provide cookie clearance header');
  assert(logoutRes.headers['set-cookie'][0].includes('Expires='), 'Session cookie must be expired');
  console.log('   ✓ Logout cookie properly invalidated');

  console.log('\n===============================================================');
  console.log('✅ ALL 8 AUTHENTICATION & SECURITY CRITERIA VERIFIED');
  console.log('===============================================================\n');
}

runAuthTests().catch(err => {
  console.error('\n❌ AUTH TEST SUITE FAILED:', err);
  process.exit(1);
});
