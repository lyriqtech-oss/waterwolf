const test = require('node:test');
const assert = require('node:assert/strict');
const { externalUrl, createSecurityState, publicResearchUrl } = require('../electron/security.cjs');

test('allows normal web addresses and rejects privileged schemes and embedded credentials', () => {
  assert.equal(externalUrl('https://example.com/path'), 'https://example.com/path');
  assert.equal(externalUrl('http://localhost:5173/'), 'http://localhost:5173/');
  for (const url of ['file:///C:/secret.txt', 'javascript:alert(1)', 'data:text/html,hi', 'https://user:pass@example.com/']) {
    assert.throws(() => externalUrl(url));
  }
});

test('reports only aggregate blocked events', () => {
  const state = createSecurityState();
  state.record('permissions'); state.record('downloads'); state.record('navigation'); state.record('other');
  assert.deepEqual(state.status(), { permissions: 1, downloads: 1, navigation: 1, downloadsBlocked: true, permissionsDenied: true, unsafeSchemesBlocked: true });
});

test('live research accepts public HTTPS and rejects local or privileged destinations', () => {
  assert.equal(publicResearchUrl('https://example.com/article'), 'https://example.com/article');
  assert.equal(publicResearchUrl('https://duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Farticle'), 'https://example.com/article');
  for (const url of ['http://example.com/', 'https://localhost/', 'https://127.0.0.1/', 'https://[::1]/', 'https://host.internal/', 'https://hidden.onion/', 'https://user:pass@example.com/', 'file:///C:/private.txt']) {
    assert.throws(() => publicResearchUrl(url), url);
  }
});
