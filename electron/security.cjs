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

module.exports = { externalUrl, createSecurityState };
