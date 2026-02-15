import Constants from 'expo-constants';

type AppEnv = {
  appName: string;
  appSlug: string;
  iosBundleId: string;
  androidPackage: string;
};

const fallbackEnv: AppEnv = {
  appName: 'Native App Template',
  appSlug: 'native-app-template',
  iosBundleId: 'com.company.nativeapp',
  androidPackage: 'com.company.nativeapp'
};

function readStringExtra(key: keyof AppEnv, fallback: string) {
  const value = Constants.expoConfig?.extra?.[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

export const env: AppEnv = {
  appName: readStringExtra('appName', fallbackEnv.appName),
  appSlug: readStringExtra('appSlug', fallbackEnv.appSlug),
  iosBundleId: readStringExtra('iosBundleId', fallbackEnv.iosBundleId),
  androidPackage: readStringExtra('androidPackage', fallbackEnv.androidPackage)
};
