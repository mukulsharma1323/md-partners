import { useSyncExternalStore } from 'react';

const localDate = value => {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
export const expired = m => !!m.expiry && m.expiry < localDate(Date.now());
export const nearExpiry = m => !!m.expiry && !expired(m) && m.expiry <= localDate(Date.now() + 30 * 86400000);
let state = {
  cart: [],
  inventory: [],
  products: [],
  prescriptionReview: [],
  prescriptionSource: null,
  orders: [],
  customers: [],
  suppliers: [],
  stores: [],
  purchaseItems: [],
  loading: true,
  error: '',
  customerId: null,
  customerMobile: '',
  customerName: '',
  checkoutPrescription: null,
  customer: 'Walk-in customer',
  channel: 'Counter',
  discount: '0',
  payment: 'UPI',
  offline: false,
  sync: 0,
  draft: false,
  prescriptions: [],
  rxId: null,
  invoice: null,
  adjustments: [],
  purchaseOrders: [],
  purchases: [],
  returns: [],
};
const listeners = new Set();
export function update(patch) {
  state = { ...state, ...patch };
  [...listeners].forEach(fn => fn());
}
const subscribe = fn => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const snapshot = () => state;
export function usePharmacy() {
  return useSyncExternalStore(subscribe, snapshot);
}
export function suggestedBatch(inventory, medicine) {
  return inventory
    .filter(
      m =>
        m.name === medicine.name &&
        m.strength === medicine.strength &&
        m.form === medicine.form &&
        !expired(m) &&
        m.stock > 0,
    )
    .sort((a, b) => a.expiry.localeCompare(b.expiry))[0]?.id;
}
export function getState() {
  return state;
}
export const saleUnits = m => {
  const units = ['Pack'];
  if (m.allowLooseSale && m.unitsPerStrip < m.pack) units.push('Strip');
  if (m.allowLooseSale) units.push(m.baseUnit === 'capsule' ? 'Capsule' : m.baseUnit === 'tablet' ? 'Tablet' : 'Unit');
  return units;
};
export const unitsFor = (m, unit) =>
  unit === 'Pack' ? m.pack : unit === 'Strip' ? m.unitsPerStrip || m.pack : 1;
export const unitPrice = (m, unit) =>
  m.price != null ? m.price : Math.round(((m.salePrice ?? m.mrp) / m.pack) * unitsFor(m, unit) * 100) / 100;
export const lineTotal = m =>
  m.total != null ? m.total : Math.round(unitPrice(m, m.unit) * m.qty * 100) / 100;
export function billingMedicine(product) {
  const batches = state.inventory.filter(m =>
    String(m.productId) === String(product.productId || product.id) &&
    !!m.expiry && !expired(m) && m.stock > 0,
  );
  return batches.sort((a, b) => a.expiry.localeCompare(b.expiry))[0] || {
    ...product,
    stock: 0,
    batch: '',
    expiry: '',
    shelf: '',
  };
}
export function addToCart(m, unit, quantity = 1) {
  if (!m) {
    return 'Medicine is no longer available.';
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000) {
    return 'Enter a whole quantity between 1 and 1000.';
  }
  unit = unit || saleUnits(m)[0];
  if (!m.batchId || !m.expiry) {
    return 'No available stock batch for this medicine.';
  }
  if (expired(m)) {
    return 'Expired batches cannot be sold.';
  }
  const units = unitsFor(m, unit);
  const existing = state.cart.find(x => x.id === m.id && x.unit === unit);
  const reserved = state.cart
    .filter(x => x.id === m.id)
    .reduce((sum, x) => sum + x.qty * x.units, 0);
  if (reserved + units * quantity > m.stock) {
    return 'Not enough stock in this batch.';
  }
  update({
    cart: existing
      ? state.cart.map(x =>
          x === existing ? { ...x, qty: x.qty + quantity } : x,
        )
      : [...state.cart, { ...m, unit, units, qty: quantity }],
    draft: true,
  });
  return null;
}
export function changeQty(index, delta) {
  const line = state.cart[index];
  if (delta > 0) {
    return addToCart(
      state.inventory.find(m => m.id === line.id) || line,
      line.unit,
    );
  }
  update({
    cart: state.cart
      .map((x, i) => (i === index ? { ...x, qty: x.qty - 1 } : x))
      .filter(x => x.qty > 0),
    draft: true,
  });
  return null;
}
export const subtotal = cart =>
  Math.round(cart.reduce((sum, x) => sum + lineTotal(x), 0) * 100) / 100;
export function totals(cart, discount) {
  const base = subtotal(cart);
  const off = Math.min(base, Math.max(0, Number(discount) || 0));
  return { base, off, total: base - off };
}

export function setCustomerMobile(value) {
  const mobile = value.replace(/\D/g, '').slice(0, 10);
  if (mobile === state.customerMobile) {
    return;
  }
  const match =
    mobile.length === 10
      ? state.customers.find(c => c.phone.replace(/\D/g, '') === mobile)
      : null;
  update({
    customerMobile: mobile,
    customerId: match?.id || null,
    customerName: match?.name || '',
    checkoutPrescription: null,
    draft: true,
  });
}
const initialState = state;
export function resetPharmacy() {
  update({ ...initialState, cart: [], inventory: [], orders: [], customers: [], loading: true });
}

export function editPrescriptionRow(id, patch) {
  update({
    prescriptionReview: state.prescriptionReview.map(row =>
      row.id === id && row.reviewStatus === 'pending'
        ? { ...row, ...patch }
        : row,
    ),
  });
}
export function confirmPrescriptionRow(id) {
  const row = state.prescriptionReview.find(item => item.id === id);
  if (!row || row.reviewStatus !== 'pending') {
    return 'This entry has already been reviewed.';
  }
  if (!row.product) {
    return 'Choose an available product or reject this entry.';
  }
  const medicine = billingMedicine(row.product);
  if (!saleUnits(medicine).includes(row.unit)) {
    return 'Choose the dispensing unit before confirming.';
  }
  const error = addToCart(medicine, row.unit, Number(row.quantity));
  if (error) {
    return error;
  }
  editPrescriptionRow(id, { reviewStatus: 'confirmed' });
  return null;
}
