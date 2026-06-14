// Jest stub: yjs -> lib0 pulls isomorphic-webcrypto's react-native entry, which
// isn't resolvable in the jest-expo env. lib0 expects an object with
// ensureSecure()/getRandomValues()/subtle — back it with Node's WebCrypto. Tests only.
const { webcrypto } = require('crypto');
module.exports = {
  ensureSecure: () => Promise.resolve(),
  getRandomValues: (arr) => webcrypto.getRandomValues(arr),
  subtle: webcrypto.subtle,
};
