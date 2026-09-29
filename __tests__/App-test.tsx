import React from 'react';
import renderer, { act } from 'react-test-renderer';
import App from '../App';
import { useAuth } from '../src/auth/AuthContext';
import { request } from '../src/api/client';
import { saveRememberedCredentials, clearRememberedCredentials } from '../src/auth/rememberedCredentials';

jest.mock('../src/auth/rememberedCredentials', () => ({
  saveRememberedCredentials: jest.fn().mockResolvedValue(undefined),
  clearRememberedCredentials: jest.fn().mockResolvedValue(undefined),
}));

// Exercise the real app provider without loading native navigation in Jest.
jest.mock('../src/navigator/AppNavigator', () => {
  return function AuthConsumer() {
    const { Text } = require('react-native');
    const auth = require('../src/auth/AuthContext').useAuth();
    return (
      <Text testID="session" auth={auth}>
        {auth.user?.email || 'signed out'}
      </Text>
    );
  };
});
let tree: renderer.ReactTestRenderer;
let auth: ReturnType<typeof useAuth>;
const response = (status: number, data: unknown) => ({
  ok: status < 400,
  status,
  json: async () => data,
});
beforeEach(() => {
  global.fetch = jest.fn();
  (saveRememberedCredentials as jest.Mock).mockClear();
  (clearRememberedCredentials as jest.Mock).mockClear();
  act(() => {
    tree = renderer.create(<App />);
  });
  auth = () => tree.root.findByProps({ testID: 'session' }).props.auth;
});
afterEach(() => {
  act(() => tree.unmount());
});
it('requires login, loads the profile, and clears the session on logout', async () => {
  expect(auth().user).toBeNull();
  (fetch as jest.Mock)
    .mockResolvedValueOnce(response(200, { access_token: 'token' }))
    .mockResolvedValueOnce(response(200, { email: 'staff@example.com' }));
  await act(async () => {
    await auth().login('staff@example.com', 'password');
  });
  expect(auth().user.email).toBe('staff@example.com');
  expect(saveRememberedCredentials).toHaveBeenCalledWith('staff@example.com', 'password');
  (fetch as jest.Mock).mockResolvedValueOnce(
    response(200, { message: 'Logged out' }),
  );
  await act(async () => {
    await auth().logout();
  });
  expect(auth().user).toBeNull();
  await expect(request('/products')).rejects.toThrow('sign in');
  expect(clearRememberedCredentials).not.toHaveBeenCalled();
});
it('keeps invalid credentials signed out and returns the server error', async () => {
  (fetch as jest.Mock).mockResolvedValueOnce(
    response(401, { message: 'Invalid credentials' }),
  );
  await act(async () => {
    await expect(auth().login('wrong@example.com', 'wrong')).rejects.toThrow(
      'Invalid credentials',
    );
  });
  expect(auth().user).toBeNull();
  expect(saveRememberedCredentials).not.toHaveBeenCalled();
});
it('clears remembered credentials when the checkbox is unchecked', async () => {
  (fetch as jest.Mock)
    .mockResolvedValueOnce(response(200, { access_token: 'token' }))
    .mockResolvedValueOnce(response(200, { email: 'staff@example.com' }));
  await act(async () => {
    await auth().login('staff@example.com', 'password', false);
  });
  expect(clearRememberedCredentials).toHaveBeenCalledTimes(1);
  expect(saveRememberedCredentials).not.toHaveBeenCalled();
});
it('returns to signed out when an authenticated request expires', async () => {
  (fetch as jest.Mock)
    .mockResolvedValueOnce(response(200, { access_token: 'token' }))
    .mockResolvedValueOnce(response(200, { email: 'staff@example.com' }));
  await act(async () => {
    await auth().login('staff@example.com', 'password');
  });
  (fetch as jest.Mock).mockResolvedValueOnce(
    response(401, { message: 'Expired' }),
  );
  await act(async () => {
    await expect(request('/products')).rejects.toThrow('Expired');
  });
  expect(auth().user).toBeNull();
  expect(auth().message).toContain('expired');
});
