module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    '/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|react-native-svg|react-native-track-player))',
  ],
  moduleNameMapper: {
    '@suniplayer/core': '<rootDir>/../../packages/core/src/index.ts',
    // yjs -> lib0 requires isomorphic-webcrypto's RN entry, unresolvable in jest.
    // Redirect to Node's WebCrypto so the shared core (CRDT) imports cleanly in tests.
    '^isomorphic-webcrypto/src/react-native$': '<rootDir>/jest/webcrypto-stub.cjs'
  }
};
