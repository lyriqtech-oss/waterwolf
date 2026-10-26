const test = require('node:test');
const assert = require('node:assert/strict');
const { externalUrl, createSecurityState, publicResearchUrl, publicResearchDestination, isPublicAddress } = require('../electron/security.cjs');

test('allows normal web addresses and rejects privileged schemes and embedded credentials', () => {
  assert.equal(externalUrl('https://example.com/path'), 'https://example.com/path');
  assert.equal(externalUrl('http://localhost:5173/'), 'http://localhost:5173/');
  for (const url of ['file:///C:/secret.txt', 'javascript:alert(1)', 'data:text/html,hi', 'https://user:pass@example.com/']) {
    assert.throws(() => externalUrl(url));
  }
});

test('reports only aggregate blocked events', () => {
  const state = createSecurityState();
  state.record('permissions'); state.record('downloads'); state.record('navigation'); state.record('agentNetwork'); state.record('certificates'); state.record('other');
  assert.deepEqual(state.status(), { permissions: 1, downloads: 1, navigation: 1, agentNetwork: 1, certificates: 1, downloadsBlocked: true, permissionsDenied: true, unsafeSchemesBlocked: true });
});

test('live research accepts public HTTPS and rejects local or privileged destinations', () => {
  assert.equal(publicResearchUrl('https://example.com/article'), 'https://example.com/article');
  assert.equal(publicResearchUrl('https://duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Farticle'), 'https://example.com/article');
  for (const url of ['http://example.com/', 'https://localhost/', 'https://localhost./', 'https://127.0.0.1/', 'https://[::1]/', 'https://host.internal/', 'https://hidden.onion/', 'https://user:pass@example.com/', 'file:///C:/private.txt']) {
    assert.throws(() => publicResearchUrl(url), url);
  }
});

test('agent DNS guard rejects private, reserved and mixed public/private answers', async () => {
  assert.equal(isPublicAddress('8.8.8.8'), true);
  for (const address of ['127.0.0.1', '10.0.0.2', '169.254.169.254', '192.168.1.1', '::1', 'fc00::1', 'fe80::1', '::ffff:192.168.1.1']) {
    assert.equal(isPublicAddress(address), false, address);
    await assert.rejects(publicResearchDestination('https://example.com/', async () => [{ address }]));
  }
  await assert.rejects(publicResearchDestination('https://example.com/', async () => [{ address: '8.8.8.8' }, { address: '10.0.0.1' }]));
  await assert.rejects(publicResearchDestination('https://example.com/', async () => []));
  assert.equal(await publicResearchDestination('https://example.com/', async () => [{ address: '8.8.8.8' }]), 'https://example.com/');
});
