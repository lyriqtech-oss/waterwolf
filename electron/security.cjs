const { isIP, BlockList } = require('node:net');

const blockedIpv4 = new BlockList();
const blockedIpv6 = new BlockList();
for (const [address, prefix, type] of [
  ['0.0.0.0', 8, 'ipv4'], ['10.0.0.0', 8, 'ipv4'], ['100.64.0.0', 10, 'ipv4'],
  ['127.0.0.0', 8, 'ipv4'], ['169.254.0.0', 16, 'ipv4'], ['172.16.0.0', 12, 'ipv4'],
  ['192.0.0.0', 24, 'ipv4'], ['192.0.2.0', 24, 'ipv4'], ['192.168.0.0', 16, 'ipv4'],
  ['198.18.0.0', 15, 'ipv4'], ['198.51.100.0', 24, 'ipv4'], ['203.0.113.0', 24, 'ipv4'],
  ['224.0.0.0', 4, 'ipv4'], ['240.0.0.0', 4, 'ipv4'],
  ['::', 128, 'ipv6'], ['::1', 128, 'ipv6'], ['::ffff:0:0', 96, 'ipv6'], ['fc00::', 7, 'ipv6'],
  ['fe80::', 10, 'ipv6'], ['ff00::', 8, 'ipv6'], ['2001:db8::', 32, 'ipv6']
]) (type === 'ipv4' ? blockedIpv4 : blockedIpv6).addSubnet(address, prefix, type);

function isPublicAddress(address) {
  const type = isIP(address);
  if (!type) return false;
  if (type === 6 && address.toLowerCase().startsWith('::ffff:')) {
    const mapped = address.slice(7);
    if (isIP(mapped) === 4) return isPublicAddress(mapped);
  }
  return !(type === 4 ? blockedIpv4.check(address, 'ipv4') : blockedIpv6.check(address, 'ipv6'));
}

function externalUrl(value) {
  if (typeof value !== 'string' || value.length > 8192) throw new Error('Invalid address');
  const url = new URL(value);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('Only HTTP and HTTPS pages can be opened');
  if (url.username || url.password) throw new Error('Addresses containing credentials are blocked');
  return url.href;
}

function createSecurityState() {
  const blocked = { permissions: 0, downloads: 0, navigation: 0, agentNetwork: 0, certificates: 0 };
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
  const host = url.hostname.replace(/^\[|\]$/g, '').replace(/\.$/, '').toLowerCase();
  if (!host.includes('.') || isIP(host) || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.test') || host.endsWith('.invalid') || host.endsWith('.onion')) {
    throw new Error('Private or local addresses are not available to agents');
  }
  return url.href;
}

async function publicResearchDestination(value, resolve) {
  const url = publicResearchUrl(value);
  const host = new URL(url).hostname.replace(/\.$/, '');
  const addresses = await resolve(host);
  if (!Array.isArray(addresses) || addresses.length === 0 || addresses.some(item => !isPublicAddress(item?.address))) {
    throw new Error('Agent request resolves to a private or unsupported network address');
  }
  return url;
}

module.exports = { externalUrl, createSecurityState, publicResearchUrl, publicResearchDestination, isPublicAddress };
