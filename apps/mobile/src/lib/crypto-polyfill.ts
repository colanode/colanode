// Polyfill globalThis.crypto.getRandomValues for libraries that expect the
// Web Crypto API (e.g. ulid). Must be imported before any code that calls
// crypto.getRandomValues().
import { getRandomValues } from 'expo-crypto';

if (typeof globalThis.crypto === 'undefined') {
  try {
    // @ts-expect-error — partial Web Crypto polyfill
    globalThis.crypto = { getRandomValues };
  } catch {
    Object.defineProperty(globalThis, 'crypto', {
      value: { getRandomValues },
      writable: true,
      configurable: true,
    });
  }
} else if (typeof globalThis.crypto.getRandomValues !== 'function') {
  try {
    // @ts-expect-error — polyfill getRandomValues
    globalThis.crypto.getRandomValues = getRandomValues;
  } catch {
    Object.defineProperty(globalThis.crypto, 'getRandomValues', {
      value: getRandomValues,
      writable: true,
      configurable: true,
    });
  }
}
