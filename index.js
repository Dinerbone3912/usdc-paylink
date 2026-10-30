/**
 * @glider/usdc-paylink — build/parse USDC payment links (EIP-681) and
 * EIP-3009 TransferWithAuthorization nonces. Dependency-free.
 */
export const NETWORKS = {
  base:     { chainId: 8453,  usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
  ethereum: { chainId: 1,     usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
  optimism: { chainId: 10,    usdc: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', decimals: 6 },
  polygon:  { chainId: 137,   usdc: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6 },
};

/** Convert a human USDC amount to base units string. */
export function toUnits(amount, decimals = 6) {
  const s = String(amount).trim();
  if (!/^\d+(\.\d+)?$/.test(s)) throw new Error('invalid amount: ' + amount);
  const [i, f = ''] = s.split('.');
  if (f.length > decimals) throw new Error('too many decimal places');
  return (i + f.padEnd(decimals, '0')).replace(/^0+(?=\d)/, '');
}

/** EIP-681 payment URI for a USDC transfer. */
export function buildPayLink({ to, amount, network = 'base', memotype }) {
  const net = NETWORKS[network];
  if (!net) throw new Error('unknown network: ' + network);
  if (!/^0x[0-9a-fA-F]{40}$/.test(to)) throw new Error('invalid recipient address');
  const units = toUnits(amount, net.decimals);
  let uri = `ethereum:${net.usdc}@${net.chainId}/transfer?address=${to}&uint256=${units}`;
  if (memotype) uri += `&memo=${encodeURIComponent(memotype)}`;
  return uri;
}

/** Parse an EIP-681 USDC transfer URI back into parts. */
export function parsePayLink(uri) {
  const m = /^ethereum:(0x[0-9a-fA-F]{40})@(\d+)\/transfer\?(.+)$/.exec(uri);
  if (!m) throw new Error('not a USDC transfer URI');
  const [, token, chainId, qs] = m;
  const params = Object.fromEntries(qs.split('&').map(kv => kv.split('=')));
  return {
    token,
    chainId: Number(chainId),
    to: params.address,
    units: params.uint256,
    amount: formatUnits(params.uint256, 6),
    memo: params.memo ? decodeURIComponent(params.memo) : undefined,
  };
}

export function formatUnits(units, decimals = 6) {
  const s = String(units).padStart(decimals + 1, '0');
  const i = s.slice(0, -decimals);
  const f = s.slice(-decimals).replace(/0+$/, '');
  return f ? `${i}.${f}` : i;
}

/** Generate a random 32-byte nonce (hex) for EIP-3009. */
export function newNonce() {
  const b = new Uint8Array(32);
  globalThis.crypto.getRandomValues(b);
  return '0x' + [...b].map(x => x.toString(16).padStart(2, '0')).join('');
}

/** Build an EIP-3009 TransferWithAuthorization object ready for signing. */
export function buildAuthorizationRequest({ from, to, value, validForSec = 3600, network = 'base', nowSec = Math.floor(Date.now()/1000) }) {
  const net = NETWORKS[network];
  if (!net) throw new Error('unknown network');
  return {
    from, to,
    value: String(value),
    validAfter: String(nowSec - 60),
    validBefore: String(nowSec + validForSec),
    nonce: newNonce(),
    chainId: net.chainId,
    verifyingContract: net.usdc,
  };
}
export default { buildPayLink, parsePayLink, formatUnits, toUnits, newNonce, buildAuthorizationRequest, NETWORKS };
