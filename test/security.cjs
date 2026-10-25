const test = require('node:test');
const assert = require('node:assert/strict');
const { externalUrl, createSecurityState } = require('../electron/security.cjs');

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
