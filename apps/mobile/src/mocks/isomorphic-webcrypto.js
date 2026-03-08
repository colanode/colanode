// Mock for isomorphic-webcrypto that delegates to the native crypto API
// (polyfilled via expo-crypto in crypto-polyfill.ts).
// lib0 (yjs dependency) calls webcrypto.ensureSecure() and uses
// webcrypto.subtle and webcrypto.getRandomValues.
const crypto = globalThis.crypto || {};

module.exports = {
  subtle: crypto.subtle || {},
  getRandomValues: crypto.getRandomValues
    ? crypto.getRandomValues.bind(crypto)
    : function () {},
  ensureSecure: function () {
    return Promise.resolve();
  },
};
