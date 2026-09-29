import { NativeModules } from 'react-native';

const SERVICE = 'md-tracker.remembered-login';
const options = { service: SERVICE, cloudSync: false };

function keychain() {
  if (!NativeModules.RNKeychainManager) {
    throw new Error('Remember me needs an updated app build. Rebuild and reopen the app.');
  }
  return require('react-native-keychain');
}

export async function getRememberedCredentials() {
  const saved = await keychain().getGenericPassword(options);
  return saved ? { username: saved.username, password: saved.password } : null;
}

export async function saveRememberedCredentials(username, password) {
  const secureStore = keychain();
  const saved = await secureStore.setGenericPassword(username.trim(), password, {
    ...options,
    accessible: secureStore.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  if (!saved) throw new Error('Could not save login details on this device.');
}

export async function clearRememberedCredentials() {
  const secureStore = keychain();
  if (!(await secureStore.getGenericPassword(options))) return;
  const cleared = await secureStore.resetGenericPassword(options);
  if (!cleared) throw new Error('Could not remove saved login details from this device.');
}
