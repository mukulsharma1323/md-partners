jest.mock('../src/api/client', () => ({ request: jest.fn() }));

import { request } from '../src/api/client';
import { fetchRetailData, createRetailInvoice, createPurchase, createStockAdjustment, reviewStockAdjustment } from '../src/api/pharmacy';
import { billingMedicine, getState, resetPharmacy, update, saleUnits } from '../src/screens/Pharmacy/pharmacyData';
import { can } from '../src/auth/permissions';

beforeEach(() => {
  request.mockReset();
  resetPharmacy();
});

it('maps store batches and retail invoices without wholesale orders or sample stock', async () => {
  request.mockResolvedValue({
    products: [{ id: 7, name: 'Med', dosage: 'Tablet', units_per_pack: 20, units_per_strip: 10, allow_loose_sale: true, requires_prescription: true, retail_price: 40, mrp: 45 }],
    inventoryBatches: [{ id: 9, productId: 7, product: { id: 7, name: 'Med', units_per_pack: 20, units_per_strip: 10, allow_loose_sale: true }, batchNumber: 'B1', expiry: '2027-10-01', quantity: 2, looseUnits: 3, retailPrice: 40 }],
    customers: [{ id: 4, name: 'A', phone: '9876543210' }],
    invoices: [{ id: 11, customerId: 4, invoiceType: 'retail', totalAmount: 35, discount: 5, paymentMode: 'Cash' }, { id: 12, customerId: 4, invoiceType: 'wholesale', totalAmount: 999 }],
    invoiceItems: [{ invoiceId: 11, productId: 7, inventoryBatchId: 9, quantity: 1, saleUnit: 'strip', price: 20, total: 20 }],
  });
  const data = await fetchRetailData();
  expect(data.inventory).toMatchObject([{ id: '9', batchId: 9, stock: 43, batch: 'B1', rx: true }]);
  expect(data.orders).toHaveLength(1);
  expect(data.orders[0].invoice.lines[0]).toMatchObject({ unit: 'Strip', price: 20, batch: 'B1' });
  update(data);
  expect(billingMedicine(data.products[0]).batchId).toBe(9);
  expect(saleUnits(getState().inventory[0])).toEqual(['Pack', 'Strip', 'Tablet']);
});

it('sends retail invoice to the existing backend endpoint', async () => {
  request.mockResolvedValue({ id: 11 });
  await createRetailInvoice({ rows: [{ batchId: 9, quantity: 1 }] });
  expect(request).toHaveBeenCalledWith('/pharmacy/invoices/retail', {
    method: 'POST',
    body: { rows: [{ batchId: 9, quantity: 1 }] },
  });
});

it('uses the existing purchase and adjustment endpoints', async () => {
  request.mockResolvedValue({ id: 1 });
  await createPurchase({ supplierId: 2, rows: [] });
  await createStockAdjustment({ batchId: 9, quantity: 2 });
  await reviewStockAdjustment(4, 'approve');
  expect(request).toHaveBeenNthCalledWith(1, '/pharmacy/purchases', { method: 'POST', body: { supplierId: 2, rows: [] } });
  expect(request).toHaveBeenNthCalledWith(2, '/pharmacy/inventory/adjustments', { method: 'POST', body: { batchId: 9, quantity: 2 } });
  expect(request).toHaveBeenNthCalledWith(3, '/pharmacy/inventory/adjustments/4/approve', { method: 'PATCH', body: {} });
});

it('respects backend role permissions in mobile navigation', () => {
  const user = { role: 'pharmacist', permissions: { inventory: { view: true, approve: false } } };
  expect(can(user, 'inventory')).toBe(true);
  expect(can(user, 'inventory', 'approve')).toBe(false);
  expect(can(user, 'retail-sales', 'create')).toBe(false);
  expect(can({ role: 'super-admin' }, 'retail-sales', 'create')).toBe(true);
});
