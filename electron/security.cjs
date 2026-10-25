const { isIP } = require('node:net');

function externalUrl(value) {
  if (typeof value !== 'string' || value.length > 8192) throw new Error('Invalid address');
  const url = new URL(value);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('Only HTTP and HTTPS pages can be opened');
  if (url.username || url.password) throw new Error('Addresses containing credentials are blocked');
  return url.href;
}

function createSecurityState() {
  const blocked = { permissions: 0, downloads: 0, navigation: 0 };
  return {
    record(kind) { if (Object.hasOwn(blocked, kind)) blocked[kind]++; },
    status() { return { ...blocked, downloadsBlocked: true, permissionsDenied: true, unsafeSchemesBlocked: true }; }
  };
}

function publicResearchUrl(value) {
  if (typeof value !== 'string' || value.length > 8192) throw new Error('Invalid research address');
  let url = new URL(value);
  if (url.hostname === 'duckduckgo.com' && url.pathname === '/l/' && url.searchParams.has('uddg')) {
    url = new URL(url.searchParams.get('uddg'));
  }
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Research requires a public HTTPS page');
  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (isIP(host) || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.test') || host.endsWith('.invalid') || host.endsWith('.onion')) {
    throw new Error('Private or local addresses are not available to agents');
  }
  return url.href;
}

module.exports = { externalUrl, createSecurityState, publicResearchUrl };
