import { normalizeProduct } from '../src/api/products';
import {
  update,
  getState,
  resetPharmacy,
  editPrescriptionRow,
  confirmPrescriptionRow,
} from '../src/screens/Pharmacy/pharmacyData';
const product = normalizeProduct({
  id: 500,
  name: 'Sample tablet',
  mrp: 100,
  units_per_pack: 100,
  units_per_strip: 10,
  base_unit: 'tablet',
});
const row = overrides => ({
  id: 'rx-1',
  name: 'Sample',
  product,
  quantity: '12',
  unit: 'Tablet',
  reviewStatus: 'pending',
  ...overrides,
});
beforeEach(() => {
  resetPharmacy();
  update({ inventory: [{ ...product, id: '9', productId: '500', batchId: 9, batch: 'B1', expiry: '2027-10-01', stock: 100 }] });
});
afterEach(resetPharmacy);
it('adds the extracted quantity atomically and cannot add a confirmed row twice', () => {
  update({ prescriptionReview: [row()] });
  expect(confirmPrescriptionRow('rx-1')).toBeNull();
  expect(getState().cart[0]).toMatchObject({
    qty: 12,
    units: 1,
    unit: 'Tablet',
  });
  expect(confirmPrescriptionRow('rx-1')).toContain('already');
  expect(getState().cart[0].qty).toBe(12);
});
it('requires a product, an explicit unit and valid dispensing quantity', () => {
  for (const patch of [
    { product: null },
    { unit: 'Unknown' },
    { quantity: '' },
    { quantity: '1.5' },
    { quantity: '-2' },
    { quantity: '1001' },
  ]) {
    update({ prescriptionReview: [row(patch)] });
    expect(confirmPrescriptionRow('rx-1')).toEqual(expect.any(String));
    expect(getState().cart).toHaveLength(0);
  }
});
it('rejects rows without cart changes and allows manual alternative selection', () => {
  update({ prescriptionReview: [row({ product: null })] });
  editPrescriptionRow('rx-1', { reviewStatus: 'rejected' });
  expect(confirmPrescriptionRow('rx-1')).toContain('already');
  expect(getState().cart).toHaveLength(0);
  update({ prescriptionReview: [row({ product: null })] });
  editPrescriptionRow('rx-1', { product, unit: 'Strip', quantity: '2' });
  expect(confirmPrescriptionRow('rx-1')).toBeNull();
  expect(getState().cart[0]).toMatchObject({ qty: 2, units: 10 });
});
it('does not partially add an oversized quantity exceeding live stock', () => {
  update({ prescriptionReview: [row({ quantity: '999', unit: 'Strip' })] });
  expect(confirmPrescriptionRow('rx-1')).toContain('Not enough stock');
  expect(getState().cart).toHaveLength(0);
  expect(getState().prescriptionReview[0].reviewStatus).toBe('pending');
});
