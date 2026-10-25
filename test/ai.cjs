const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const Module = require('node:module');

const profile = path.join(os.tmpdir(), `waterwolf-ai-test-${process.pid}`);
const electron = {
  app: { getPath: () => profile },
  safeStorage: {
    isAsyncEncryptionAvailable: async () => true,
    encryptStringAsync: async value => Buffer.from(`sealed:${value}`),
    decryptStringAsync: async bytes => ({ result: bytes.toString().replace(/^sealed:/, '') })
  }
};
const originalLoad = Module._load;
Module._load = function (name, parent, isMain) { return name === 'electron' ? electron : originalLoad.call(this, name, parent, isMain); };
const ai = require('../electron/ai.cjs');
Module._load = originalLoad;

test('saves only encrypted key material and removes it', async () => {
  await ai.save({ provider: 'openai', key: 'sk-localtest12345', model: 'gpt-4o-mini' });
  assert.deepEqual(await ai.status(), { configured: true, provider: 'openai', model: 'gpt-4o-mini' });
  const file = await fs.readFile(path.join(profile, 'ai-provider.json'), 'utf8');
  assert.equal(file.includes('sk-localtest12345'), false);
  await ai.remove();
  assert.equal((await ai.status()).configured, false);
});

test('summarizes only page text from approved snapshot with a bounded request', async () => {
  await ai.save({ provider: 'openai', key: 'sk-localtest12345', model: 'gpt-4o-mini' });
  const snapshot = await ai.preview({ isDestroyed: () => false, getURL: () => 'https://example.com/', executeJavaScript: async () => ({ title: 'Example', text: 'A page for documentation.' }) });
  let request;
  const originalFetch = global.fetch;
  global.fetch = async (_url, options) => { request = options; return { ok: true, json: async () => ({ choices: [{ message: { content: 'Short summary.' } }] }) }; };
  try { assert.equal(await ai.summarize(snapshot), 'Short summary.'); }
  finally { global.fetch = originalFetch; await ai.remove(); }
  const body = JSON.parse(request.body);
  assert.equal(body.max_completion_tokens, 1024);
  assert.equal(body.store, false);
  assert.match(body.messages[1].content, /A page for documentation/);
  assert.equal(request.redirect, 'error');
});

test('Gemini sends the key in a header and extracts the generated text', async () => {
  await ai.save({ provider: 'gemini', key: 'gemini-localtest12345', model: 'gemini-2.5-flash' });
  let request, endpoint;
  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    endpoint = url; request = options;
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: 'Gemini summary.' }] } }] }) };
  };
  try {
    assert.equal(await ai.testConnection(), 'Gemini summary.');
    assert.equal((await ai.status()).provider, 'gemini');
  } finally { global.fetch = originalFetch; await ai.remove(); }
  assert.match(endpoint, /generativelanguage\.googleapis\.com/);
  assert.equal(request.headers['x-goog-api-key'], 'gemini-localtest12345');
  const body = JSON.parse(request.body);
  assert.equal(body.generationConfig.maxOutputTokens, 32);
  assert.match(body.contents[0].parts[0].text, /single word OK/);
});
