import { buildPartnerWorkspace } from '../partner';

const payload = {
  loadedSections: ['catalog', 'crm', 'wholesale'],
  products: [
    { id: 7, name: 'Product A', wholesale_price: 42 },
  ],
  customers: [
    { id: 3, name: 'Wholesale Customer', type: 'wholesale', city: 'Delhi' },
    { id: 4, name: 'Retail Customer', type: 'retail' },
  ],
  orders: [
    { id: 10, customerId: 3, totalAmount: '84', status: 'placed' },
    { id: 11, customerId: 4, totalAmount: '50', status: 'placed' },
  ],
  orderItems: [
    { orderId: 10, productId: 7 },
    { orderId: 10, productId: 7 },
  ],
  orderTracking: [
    { orderId: 10, status: 'received', timestamp: '2026-10-20T10:00:00Z' },
  ],
  inventoryBatches: [{ productId: 7, quantity: 5, wholesalePrice: 36, batchNumber: 'B-7' }],
};

it('derives partners only from wholesale customers with real wholesale orders', () => {
  const workspace = buildPartnerWorkspace(payload);

  expect(workspace.partners).toHaveLength(1);
  expect(workspace.partners[0]).toMatchObject({
    id: '3',
    name: 'Wholesale Customer',
    type: 'Wholesale',
    order: 84,
    orderCount: 1,
  });
  expect(workspace.orders).toHaveLength(2);
  expect(workspace.orders[0]).toMatchObject({
    id: '10',
    itemCount: 2,
    customer: { name: 'Wholesale Customer' },
  });
  expect(workspace.products[0]).toMatchObject({
    id: '7',
    name: 'Product A',
    wholesalePrice: 36,
    batchNumber: 'B-7',
    stock: 5,
  });
});

it('surfaces missing workspace permissions instead of returning empty data', () => {
  expect(() =>
    buildPartnerWorkspace({ ...payload, loadedSections: ['catalog'] }),
  ).toThrow('crm, wholesale');
});
