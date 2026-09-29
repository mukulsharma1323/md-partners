import React from 'react';
import renderer, { act } from 'react-test-renderer';
import PrescriptionSearch from '../src/screens/Pharmacy/PrescriptionSearch';
import { Button, Field } from '../src/screens/Pharmacy/PharmacyUI';
import { resetPharmacy, getState, update } from '../src/screens/Pharmacy/pharmacyData';
import { choosePrescription } from '../src/services/prescriptionPicker';
import { scanPrescription } from '../src/api/prescriptions';
import { normalizeProduct } from '../src/api/products';
jest.mock('../src/services/prescriptionPicker', () => ({
  choosePrescription: jest.fn(),
}));
jest.mock('../src/api/prescriptions', () => ({ scanPrescription: jest.fn() }));
jest.mock('../src/api/useProducts', () => ({
  __esModule: true,
  default: () => ({ items: [], loading: false, error: '', meta: { total: 0 } }),
}));
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 }),
}));
let tree;
const find = title =>
  tree.root.findAllByType(Button).find(b => b.props.title === title);
const press = async title => {
  const button = find(title);
  expect(button.props.disabled).toBeFalsy();
  await act(async () => {
    await button.props.onPress();
  });
};
const product = normalizeProduct({
  id: 5,
  name: 'Medicine Tablet',
  mrp: 100,
  units_per_pack: 10,
  units_per_strip: 10,
});
beforeEach(() => {
  resetPharmacy();
  update({ inventory: [{ ...product, id: '9', productId: '5', batchId: 9, batch: 'B1', expiry: '2027-10-01', stock: 100 }] });
  jest.clearAllMocks();
  act(() => {
    tree = renderer.create(<PrescriptionSearch />);
  });
});
afterEach(() => act(() => tree.unmount()));
it('uploads, shows unavailable names, confirms quantity and rejects missing medicine', async () => {
  choosePrescription.mockResolvedValue({
    uri: 'file:///rx.jpg',
    name: 'rx.jpg',
    type: 'image/jpeg',
  });
  scanPrescription.mockResolvedValue([
    {
      id: 'rx-1',
      name: 'Medicine',
      quantity: '3',
      unit: 'Tablet',
      product,
      candidates: [product],
      reviewStatus: 'pending',
      status: 'matched',
    },
    {
      id: 'rx-2',
      name: 'Missing medicine',
      quantity: '',
      unit: 'Unknown',
      product: null,
      candidates: [],
      reviewStatus: 'pending',
      status: 'not_available',
    },
  ]);
  await press('Search prescription');
  await press('Take photo');
  expect(JSON.stringify(tree.toJSON())).toContain('Not available');
  expect(getState().cart).toHaveLength(0);
  await press('Confirm');
  expect(getState().cart[0].qty).toBe(3);
  await press('Reject');
  expect(getState().prescriptionReview[1].reviewStatus).toBe('rejected');
});
it('keeps an unclear quantity empty until entered and shows retry for server errors', async () => {
  choosePrescription.mockResolvedValue({
    uri: 'file:///rx.pdf',
    name: 'rx.pdf',
    type: 'application/pdf',
  });
  scanPrescription.mockRejectedValueOnce(new Error('Scanner unavailable'));
  await press('Search prescription');
  await press('Upload PDF / image');
  expect(JSON.stringify(tree.toJSON())).toContain('Scanner unavailable');
  scanPrescription.mockResolvedValueOnce([
    {
      id: 'rx-1',
      name: 'Medicine',
      quantity: '',
      unit: 'Tablet',
      product,
      candidates: [],
      reviewStatus: 'pending',
    },
  ]);
  await press('Retry scan');
  expect(find('Confirm').props.disabled).toBe(true);
  act(() => tree.root.findByType(Field).props.onChangeText('4'));
  await press('Confirm');
  expect(getState().cart[0].qty).toBe(4);
});
it('ignores a late extraction response after cancelling a scan', async () => {
  choosePrescription.mockResolvedValue({
    uri: 'file:///rx.pdf',
    name: 'rx.pdf',
    type: 'application/pdf',
  });
  let resolve;
  scanPrescription.mockImplementation(
    () =>
      new Promise(done => {
        resolve = done;
      }),
  );
  await press('Search prescription');
  let upload;
  await act(async () => {
    upload = find('Upload PDF / image').props.onPress();
  });
  await press('Cancel scan');
  await act(async () => {
    resolve([{ id: 'late' }]);
    await upload;
  });
  expect(getState().prescriptionReview).toHaveLength(0);
});
