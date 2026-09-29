import React from 'react';
import renderer, { act } from 'react-test-renderer';
import Home from '../Home';
import NewSale from '../NewSale';
import Cart from '../Cart';
import Orders, { OrderDetail } from '../Orders';
import Stock, { BatchDetail } from '../Stock';
import More from '../More';
import PurchaseEntry, { Suppliers, Adjustments } from '../Purchases';
import Customers, { CustomerDetail } from '../Customers';
import Reports from '../Reports';
import Sales from '../Sales';
import { update, resetPharmacy } from '../pharmacyData';

jest.mock('../../../auth/AuthContext', () => ({
  useAuth: () => ({ user: { email: 'staff@example.com' }, logout: jest.fn() }),
}));
jest.mock('../../../api/useProducts', () => ({
  __esModule: true,
  default: () => ({ items: [], meta: { total: 0 }, loading: false, error: '', refresh: jest.fn() }),
}));
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const navigation = { navigate: jest.fn(), goBack: jest.fn(), canGoBack: () => true };

beforeEach(() => {
  resetPharmacy();
  update({ loading: false, products: [], inventory: [], customers: [], orders: [], suppliers: [] });
});

it.each([
  [Home, {}], [NewSale, {}], [Cart, {}], [Orders, {}], [Stock, {}],
  [More, {}], [PurchaseEntry, {}], [Suppliers, {}], [Adjustments, {}],
  [Customers, {}], [Reports, {}], [Sales, {}],
  [OrderDetail, { id: 'missing' }], [BatchDetail, { id: 'missing' }],
  [CustomerDetail, { id: 'missing' }],
])('renders live screen %s with empty store data', (Component, params) => {
  let tree;
  act(() => { tree = renderer.create(<Component navigation={navigation} route={{ params }} />); });
  expect(tree.toJSON()).toBeTruthy();
  act(() => tree.unmount());
});
