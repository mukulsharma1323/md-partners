import { request } from './client';
import { normalizeProduct } from './products';

const number = value => Number(value) || 0;
const date = value => String(value || '').slice(0, 10);

export async function fetchRetailData() {
  const payload = await request(
    '/pharmacy/bootstrap?sections=reference,catalog,crm,inventory,purchases,sales',
  );
  const products = new Map(
    (payload.products || []).map(product => [String(product.id), product]),
  );
  const allCustomers = (payload.customers || []).map(customer => ({
    ...customer,
    id: String(customer.id),
    phone: customer.phone || '',
    due: number(customer.outstandingAmount),
  }));
  const inventory = (payload.inventoryBatches || []).map(batch => {
    const source = {
      ...(products.get(String(batch.productId)) || {}),
      ...(batch.product || {}),
    };
    const product = normalizeProduct(source);
    return {
      ...product,
      id: String(batch.id),
      productId: String(batch.productId),
      batchId: batch.id,
      batch: batch.batchNumber || '',
      expiry: date(batch.expiry),
      shelf: batch.shelf || '',
      stock: number(batch.quantity) * product.pack + number(batch.looseUnits),
      min: 21 * product.pack,
      mrp: number(batch.mrp || source.mrp),
      salePrice: number(batch.retailPrice || source.retail_price || source.mrp),
      cost: number(batch.purchasePrice || source.purchase_rate),
      catalogOnly: false,
    };
  });
  const items = payload.invoiceItems || [];
  const invoices = (payload.invoices || [])
    .filter(invoice => invoice.invoiceType === 'retail')
    .map(invoice => {
      const customer = allCustomers.find(c => String(c.id) === String(invoice.customerId));
      const lines = items
        .filter(item => String(item.invoiceId) === String(invoice.id))
        .map(item => {
          const product = products.get(String(item.productId)) || {};
          const medicine = inventory.find(batch => batch.productId === String(item.productId)) || normalizeProduct(product);
          return {
            ...medicine,
            id: String(item.inventoryBatchId || item.batchId || item.productId),
            unit: ({ pack: 'Pack', strip: 'Strip', unit: medicine.baseUnit === 'capsule' ? 'Capsule' : medicine.baseUnit === 'tablet' ? 'Tablet' : 'Unit', tablet: 'Tablet', capsule: 'Capsule' })[item.saleUnit] || 'Pack',
            qty: number(item.quantity),
            price: number(item.price),
            total: number(item.total),
            batch: inventory.find(batch => String(batch.batchId) === String(item.inventoryBatchId))?.batch || '',
            expiry: inventory.find(batch => String(batch.batchId) === String(item.inventoryBatchId))?.expiry || '',
          };
        });
      const total = number(invoice.totalAmount);
      const off = number(invoice.discount);
      return {
        id: `MD-${invoice.id}`,
        serverId: invoice.id,
        customer: customer?.name || 'Walk-in customer',
        customerId: customer?.id || null,
        customerMobile: customer?.phone || '',
        channel: 'Counter',
        status: 'Handed over',
        amount: total,
        items: lines.map(line => `${line.name} × ${line.qty} ${line.unit}`).join(' · '),
        createdAt: invoice.createdAt,
        invoice: {
          id: `MD-${invoice.id}`,
          customer: customer?.name || 'Walk-in customer',
          customerMobile: customer?.phone || '',
          channel: 'Counter',
          payment: invoice.paymentMode,
          lines,
          base: total + off,
          off,
          total,
          createdAt: invoice.createdAt,
        },
      };
    });
  return {
    products: (payload.products || []).map(normalizeProduct),
    inventory,
    customers: allCustomers.filter(customer => String(customer.type || '').toLowerCase() === 'retail' || invoices.some(invoice => invoice.customerId === customer.id)),
    orders: invoices,
    suppliers: payload.suppliers || [],
    purchases: payload.purchases || [],
    purchaseItems: payload.purchaseItems || [],
    adjustments: payload.stockAdjustments || [],
    stores: payload.stores || [],
  };
}

export function createRetailInvoice(body) {
  return request('/pharmacy/invoices/retail', { method: 'POST', body });
}

export function createPurchase(body) {
  return request('/pharmacy/purchases', { method: 'POST', body });
}

export function createStockAdjustment(body) {
  return request('/pharmacy/inventory/adjustments', { method: 'POST', body });
}

export function reviewStockAdjustment(id, decision, rejectionNote = '') {
  const action = decision === 'approve' ? 'approve' : 'reject';
  return request(`/pharmacy/inventory/adjustments/${id}/${action}`, {
    method: 'PATCH',
    body: action === 'reject' ? { rejectionNote } : {},
  });
}
