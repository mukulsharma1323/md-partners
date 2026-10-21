import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Checkbox, TextInput } from 'react-native-paper';
import { Image } from 'react-native';
import Login from '../src/screens/Login';
import { Button } from '../src/screens/Pharmacy/PharmacyUI';
import { getRememberedCredentials, clearRememberedCredentials } from '../src/auth/rememberedCredentials';

const mockLogin = jest.fn().mockResolvedValue(null);
jest.mock('../src/auth/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin, message: '' }),
}));
jest.mock('../src/auth/rememberedCredentials', () => ({
  getRememberedCredentials: jest.fn(),
  clearRememberedCredentials: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'SafeAreaView', useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) }));

let tree;
beforeEach(() => {
  jest.clearAllMocks();
  getRememberedCredentials.mockResolvedValue({ username: 'staff@example.com', password: 'saved-password' });
});
afterEach(() => {
  if (tree) act(() => tree.unmount());
  tree = null;
});

async function mount() {
  await act(async () => {
    tree = renderer.create(<Login />);
  });
}

it('renders the default logo without a theme provider', async () => {
  await mount();
  expect(tree.root.findByType(Image).props.source).toBeTruthy();
});

it('starts checked and fills saved username and password', async () => {
  await mount();
  const fields = tree.root.findAllByType(TextInput);
  expect(fields.map(field => field.props.value)).toEqual(['staff@example.com', 'saved-password']);
  expect(tree.root.findByType(Checkbox.Item).props.status).toBe('checked');
  await act(async () => tree.root.findByType(Button).props.onPress());
  expect(mockLogin).toHaveBeenCalledWith('staff@example.com', 'saved-password', true);
});

it('keeps Remember me checked for a first login with no saved details', async () => {
  getRememberedCredentials.mockResolvedValue(null);
  await mount();
  expect(tree.root.findByType(Checkbox.Item).props.status).toBe('checked');
  expect(tree.root.findAllByType(TextInput).map(field => field.props.value)).toEqual(['', '']);
});

it('clears stored credentials when unchecked and signs in without remembering', async () => {
  await mount();
  await act(async () => tree.root.findByType(Checkbox.Item).props.onPress());
  expect(clearRememberedCredentials).toHaveBeenCalledTimes(1);
  expect(tree.root.findByType(Checkbox.Item).props.status).toBe('unchecked');
  await act(async () => tree.root.findByType(Button).props.onPress());
  expect(mockLogin).toHaveBeenCalledWith('staff@example.com', 'saved-password', false);
});
