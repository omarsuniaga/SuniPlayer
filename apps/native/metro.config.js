const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Only watch source packages — NOT node_modules (too large with shamefully-hoist,
// causes Metro to hang scanning 1274 packages). node_modules is handled via
// nodeModulesPaths for resolution; watching it is unnecessary.
config.watchFolders = [
  path.resolve(monorepoRoot, 'packages'),  // @suniplayer/core source
];

// Resolve packages from the monorepo root (shamefully-hoisted pnpm layout)
config.resolver.nodeModulesPaths = [
  path.resolve(monorepoRoot, 'node_modules'),
];

config.resolver.unstable_enableSymlinks = true;

module.exports = config;
