import { normalizeProduct } from '../src/api/products';
import {
  billingMedicine,
  saleUnits,
  unitPrice,
  addToCart,
  changeQty,
  totals,
  getState,
  resetPharmacy,
  update,
} from '../src/screens/Pharmacy/pharmacyData';
beforeEach(resetPharmacy);
afterEach(resetPharmacy);
const product = overrides =>
  billingMedicine(
    normalizeProduct({
      id: 100,
      name: 'Example Tablet',
      mrp: 120,
      retail_price: 100,
      strength_pack_size: '10 x 10 tablets',
      ...overrides,
    }),
  );
it('calculates full-pack, strip and tablet prices from packing, keeping retail and MRP distinct', () => {
  const m = product();
  expect(m.pack).toBe(100);
  expect(m.unitsPerStrip).toBe(10);
  expect(saleUnits(m)).toEqual(['Pack', 'Strip', 'Tablet']);
  expect(unitPrice(m, 'Pack')).toBe(100);
  expect(unitPrice(m, 'Strip')).toBe(10);
  expect(unitPrice(m, 'Tablet')).toBe(1);
  expect(m.mrp).toBe(120);
});
it('uses explicit packaging counts in preference to descriptive text', () => {
  const m = product({
    units_per_pack: 150,
    units_per_strip: 15,
    retail_price: 300,
  });
  expect(unitPrice(m, 'Tablet')).toBe(2);
  expect(unitPrice(m, 'Strip')).toBe(30);
});
it('does not confuse medicine strength or liquid volume with tablet count', () => {
  const unknown = product({ strength_pack_size: '500 mg' });
  expect(saleUnits(unknown)).toEqual(['Pack']);
  const liquid = product({
    name: 'Example Syrup',
    strength_pack_size: '100 ml',
    base_unit: 'ml',
    units_per_pack: 100,
  });
  expect(saleUnits(liquid)).toEqual(['Pack']);
  expect(unitPrice(liquid, 'Pack')).toBe(100);
});
it('supports count descriptors and capsules and honors disabled loose sale', () => {
  expect(product({ strength_pack_size: 'strip of 15 tablets' }).pack).toBe(15);
  expect(
    saleUnits(
      product({ name: 'Example Capsule', strength_pack_size: '10 capsules' }),
    ),
  ).toEqual(['Pack', 'Capsule']);
  expect(saleUnits(product({ allow_loose_sale: false }))).toEqual(['Pack']);
});
it('keeps live medicine quantities and totals correct after navigating away from search', () => {
  const m = { ...product(), id: '9', batchId: 9, batch: 'B1', expiry: '2027-10-01', stock: 100 };
  update({ inventory: [m] });
  expect(addToCart(m, 'Strip')).toBeNull();
  expect(addToCart(m, 'Tablet')).toBeNull();
  expect(changeQty(0, 1)).toBeNull();
  expect(getState().cart.map(x => x.qty * x.units)).toEqual([20, 1]);
  expect(totals(getState().cart, '1')).toEqual({ base: 21, off: 1, total: 20 });
  changeQty(1, -1);
  expect(totals(getState().cart, '0').total).toBe(20);
});
it('rounds unit prices consistently and respects the live stock limit', () => {
  const m = { ...product({ strength_pack_size: '3 tablets', retail_price: 10 }), id: '9', batchId: 9, batch: 'B1', expiry: '2027-10-01', stock: 2 };
  expect(unitPrice(m, 'Tablet')).toBe(3.33);
  update({ inventory: [m] });
  addToCart(m, 'Tablet');
  changeQty(0, 1);
  expect(totals(getState().cart, '0').base).toBe(6.66);
  expect(changeQty(0, 1)).toContain('Not enough stock');
});
