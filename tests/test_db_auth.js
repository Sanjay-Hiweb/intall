// tests/test_db_auth.js — Automated Verification for SQLite Auth, Password Rules, and Analytics
const assert = require('node:assert');
const {
  validatePassword,
  registerLocalUser,
  verifyLocalUser,
  upsertGoogleUser,
  createSession,
  getSession,
  deleteSession,
  logEvent,
  getAnalyticsSummary
} = require('../src/db.js');

console.log('🧪 Starting SQLite DB, Password Rules & Analytics Tests...');

// 1. Password Strength Validation Tests
console.log('\n--- 1. Testing Password Strength Rules ---');
// Weak passwords must fail
assert.strictEqual(validatePassword('weak').valid, false, 'Should reject short password');
assert.strictEqual(validatePassword('nouppercase12!@').valid, false, 'Should reject password without uppercase');
assert.strictEqual(validatePassword('NOLOWERCASE12!@').valid, false, 'Should reject password without lowercase');
assert.strictEqual(validatePassword('OnlyOneDigit1!@').valid, false, 'Should reject password with only 1 digit');
assert.strictEqual(validatePassword('NoSpecialChar12AB').valid, false, 'Should reject password without special character');

// Strong passwords must pass
const strongPass1 = 'Architect@2026';
const res1 = validatePassword(strongPass1);
assert.strictEqual(res1.valid, true, `Expected valid for "${strongPass1}", got errors: ${res1.errors}`);

const strongPass2 = 'Cad#99Design!';
const res2 = validatePassword(strongPass2);
assert.strictEqual(res2.valid, true, `Expected valid for "${strongPass2}", got errors: ${res2.errors}`);
console.log('✓ Password rules correctly reject weak passwords and accept strong passwords.');

// 2. User Registration & Local Login
console.log('\n--- 2. Testing User Registration & Local Auth ---');
const testEmail = `test_architect_${Date.now()}@gmail.com`;

// Attempting weak password during registration must throw
assert.throws(() => {
  registerLocalUser({ email: testEmail, password: 'weak', name: 'Test Architect' });
}, /Password must be/);

// Valid registration
const newUser = registerLocalUser({
  email: testEmail,
  password: 'Strong@Password99',
  name: 'Studio Master Architect'
});
assert.ok(newUser.id, 'User must have an ID');
assert.strictEqual(newUser.email, testEmail);
assert.strictEqual(newUser.auth_provider, 'local');
console.log('✓ Successfully registered local user with strong password:', newUser.email);

// Verify correct login
const loginSuccess = verifyLocalUser(testEmail, 'Strong@Password99');
assert.strictEqual(loginSuccess.success, true);
assert.strictEqual(loginSuccess.user.email, testEmail);

// Verify wrong password fails
const loginFail = verifyLocalUser(testEmail, 'WrongPassword99!');
assert.strictEqual(loginFail.success, false);
console.log('✓ Local login verified with correct password and rejected with bad credentials.');

// 3. Google OAuth User Upsert
console.log('\n--- 3. Testing Google User Upsert ---');
const googleUser = upsertGoogleUser({
  id: 'google-sub-998877',
  email: 'google.architect@gmail.com',
  name: 'Google User',
  given_name: 'Google',
  picture: 'https://lh3.googleusercontent.com/photo.jpg'
});
assert.strictEqual(googleUser.email, 'google.architect@gmail.com');
assert.strictEqual(googleUser.auth_provider, 'google');
console.log('✓ Google OAuth user upserted successfully.');

// 4. Session Management
console.log('\n--- 4. Testing SQLite Session Creation & Retrieval ---');
const { sessionId, csrfToken } = createSession(newUser);
assert.ok(sessionId, 'Session ID must exist');
assert.ok(csrfToken, 'CSRF token must exist');

const fetchedSession = getSession(sessionId);
assert.ok(fetchedSession, 'Session must be retrieved from SQLite');
assert.strictEqual(fetchedSession.email, testEmail);

deleteSession(sessionId);
assert.strictEqual(getSession(sessionId), null, 'Deleted session must be null');
console.log('✓ SQLite session lifecycle verified.');

// 5. Analytics & Metrics Aggregation
console.log('\n--- 5. Testing Analytics Engine ---');
logEvent({ event_type: 'view', path: '/', ip: '127.0.0.1' });
logEvent({ event_type: 'view', path: '/index.html', ip: '127.0.0.1', user_id: newUser.id, user_email: newUser.email });
logEvent({ event_type: 'signup', path: '/signin', ip: '127.0.0.1', user_id: newUser.id, user_email: newUser.email });
logEvent({ event_type: 'login', path: '/signin', ip: '127.0.0.1', user_id: newUser.id, user_email: newUser.email });

const metrics = getAnalyticsSummary();
assert.ok(metrics.totalViews >= 2, 'Views should be recorded');
assert.ok(metrics.totalLogins >= 1, 'Logins should be recorded');
assert.ok(metrics.totalSignups >= 1, 'Signups should be recorded');
assert.ok(Array.isArray(metrics.recentEvents), 'Recent events should be an array');
console.log('✓ Analytics summary generated successfully:', {
  views: metrics.totalViews,
  visits: metrics.totalVisits,
  logins: metrics.totalLogins,
  signups: metrics.totalSignups,
  users: metrics.totalUsers
});

console.log('\n🎉 ALL DATABASE, AUTH & ANALYTICS TESTS PASSED!');
