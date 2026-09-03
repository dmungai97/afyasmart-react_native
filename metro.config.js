const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Metro's newer "Package Exports" resolution picks Firebase's ESM build for
// some internal packages, which uses `import.meta.url` — but the web bundle
// loads as a classic script (no type="module"), which can't parse that at
// all ("Uncaught SyntaxError: Cannot use 'import.meta' outside a module").
// Disabling this makes Metro fall back to Firebase's plain CJS/browser entry
// instead. Known issue with Expo web + the modular Firebase JS SDK.
config.resolver.unstable_enablePackageExports = false;

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-maps') {
    return {
      filePath: path.resolve(__dirname, 'src/shims/react-native-maps.web.tsx'),
      type: 'sourceFile',
    };
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
