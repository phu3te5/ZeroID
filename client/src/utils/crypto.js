// client/src/utils/crypto.js
export function generateRandomBytes(length = 32) {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateSessionData() {
  const r = generateRandomBytes();
  const salt = generateRandomBytes();
  return { r, salt };
}
