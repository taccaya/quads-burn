import type { ConfigContext, ExpoConfig } from '@expo/config';

const defaults = {
  appName: 'Native App Template',
  appSlug: 'native-app-template',
  iosBundleId: 'com.company.nativeapp',
  androidPackage: 'com.company.nativeapp'
};

const slugPattern = /^[a-z0-9-]+$/;
const iosBundleIdPattern = /^[A-Za-z0-9.-]+$/;
const androidPackagePattern = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;

function readEnv(name: string, fallback: string) {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : fallback;
}

function assertWithMessage(value: string, pattern: RegExp, message: string) {
  if (!pattern.test(value)) {
    throw new Error(message);
  }
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const appName = readEnv('APP_NAME', defaults.appName);
  const appSlug = readEnv('APP_SLUG', defaults.appSlug);
  const iosBundleId = readEnv('IOS_BUNDLE_ID', defaults.iosBundleId);
  const androidPackage = readEnv('ANDROID_PACKAGE', defaults.androidPackage);

  assertWithMessage(appSlug, slugPattern, 'APP_SLUG must match ^[a-z0-9-]+$');
  assertWithMessage(
    iosBundleId,
    iosBundleIdPattern,
    'IOS_BUNDLE_ID must include only letters, numbers, dots, or hyphens'
  );

  if (!iosBundleId.includes('.')) {
    throw new Error('IOS_BUNDLE_ID must include at least one dot');
  }

  assertWithMessage(
    androidPackage,
    androidPackagePattern,
    'ANDROID_PACKAGE must match ^[a-z][a-z0-9_]*(\\.[a-z][a-z0-9_]*)+$'
  );

  return {
    ...config,
    name: appName,
    slug: appSlug,
    scheme: appSlug.replace(/-/g, ''),
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: iosBundleId
    },
    android: {
      package: androidPackage,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      }
    },
    web: {
      bundler: 'metro',
      favicon: './assets/favicon.png'
    },
    plugins: ['expo-router'],
    experiments: {
      typedRoutes: true
    },
    extra: {
      appName,
      appSlug,
      iosBundleId,
      androidPackage
    }
  };
};
