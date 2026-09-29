import { NativeModules } from 'react-native';
import * as Keychain from 'react-native-keychain';
import {
  getRememberedCredentials,
  saveRememberedCredentials,
  clearRememberedCredentials,
} from '../src/auth/rememberedCredentials';

jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'device-only' },
  getGenericPassword: jest.fn(),
  setGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
}));

beforeEach(() => {
  NativeModules.RNKeychainManager = {};
  jest.clearAllMocks();
});

it('stores credentials in the device keychain and restores them', async () => {
  Keychain.setGenericPassword.mockResolvedValue(true);
  Keychain.getGenericPassword.mockResolvedValue({ username: 'staff@example.com', password: 'secret' });
  Keychain.resetGenericPassword.mockResolvedValue(true);
  await saveRememberedCredentials(' staff@example.com ', 'secret');
  expect(Keychain.setGenericPassword).toHaveBeenCalledWith('staff@example.com', 'secret', {
    service: 'md-tracker.remembered-login',
    cloudSync: false,
    accessible: 'device-only',
  });
  await expect(getRememberedCredentials()).resolves.toEqual({ username: 'staff@example.com', password: 'secret' });
  await clearRememberedCredentials();
  expect(Keychain.resetGenericPassword).toHaveBeenCalledWith({ service: 'md-tracker.remembered-login', cloudSync: false });
});

it('returns no credentials when none are stored and requires a rebuilt native app', async () => {
  Keychain.getGenericPassword.mockResolvedValue(false);
  await expect(getRememberedCredentials()).resolves.toBeNull();
  await clearRememberedCredentials();
  expect(Keychain.resetGenericPassword).not.toHaveBeenCalled();
  delete NativeModules.RNKeychainManager;
  await expect(getRememberedCredentials()).rejects.toThrow('updated app build');
});
