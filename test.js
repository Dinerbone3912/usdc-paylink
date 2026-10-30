import { test } from 'node:test';
import assert from 'node:assert';
import { buildPayLink, parsePayLink, toUnits, formatUnits, newNonce, buildAuthorizationRequest } from './index.js';
test('toUnits', () => {
  assert.strictEqual(toUnits('1.5'), '1500000');
  assert.strictEqual(toUnits('0.05'), '50000');
  assert.strictEqual(toUnits('100'), '100000000');
  assert.throws(() => toUnits('1.1234567'));
});
test('build + parse roundtrip', () => {
  const link = buildPayLink({ to:'0x944664B9d45fEf8C9BDBb084Ce59E6f6eE724861', amount:'0.05', network:'base', memotype:'bounty' });
  const p = parsePayLink(link);
  assert.strictEqual(p.to.toLowerCase(), '0x944664b9d45fef8c9bdbb084ce59e6f6ee724861');
  assert.strictEqual(p.amount, '0.05');
  assert.strictEqual(p.chainId, 8453);
  assert.strictEqual(p.memo, 'bounty');
});
test('formatUnits', () => {
  assert.strictEqual(formatUnits('1500000'), '1.5');
  assert.strictEqual(formatUnits('50000'), '0.05');
  assert.strictEqual(formatUnits('100000000'), '100');
});
test('newNonce is 32-byte hex and unique', () => {
  const a = newNonce(), b = newNonce();
  assert.match(a, /^0x[0-9a-f]{64}$/);
  assert.notStrictEqual(a, b);
});
test('buildAuthorizationRequest shape', () => {
  const r = buildAuthorizationRequest({ from:'0xaaa', to:'0xbbb', value:'50000', network:'base' });
  assert.strictEqual(r.verifyingContract, '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913');
  assert.strictEqual(Number(r.validBefore) > Number(r.validAfter), true);
});
