import { request } from './client';
import { normalizeProduct } from './products';

const REQUIRED_SECTIONS = ['catalog', 'crm', 'wholesale'];
const number = value => (Number.isFinite(Number(value)) ? Number(value) : 0);

export function getCurrentOrderStatus(order, tracking = []) {
  const latestEvent = tracking.reduce((latest, event) => {
    if (!latest || new Date(event.timestamp) > new Date(latest.timestamp)) {
      return event;
    }
    return latest;
  }, null);
  return latestEvent?.status || order.status || 'placed';
}

export function buildPartnerWorkspace(payload) {
  const loadedSections = Array.isArray(payload.loadedSections)
    ? payload.loadedSections
    : [];
  const missingSections = REQUIRED_SECTIONS.filter(
    section => !loadedSections.includes(section),
  );
  if (missingSections.length) {
    throw new Error(
      `Your account does not have access to: ${missingSections.join(', ')}.`,
    );
  }
  if (
    !Array.isArray(payload.products) ||
    !Array.isArray(payload.customers) ||
    !Array.isArray(payload.orders) ||
    !Array.isArray(payload.orderItems) ||
    !Array.isArray(payload.orderTracking)
  ) {
    throw new Error('The server returned incomplete wholesale workspace data.');
  }

  const customers = payload.customers.map(customer => ({
    ...customer,
    id: String(customer.id),
    outstandingAmount: number(customer.outstandingAmount),
  }));
  const customersById = new Map(customers.map(customer => [customer.id, customer]));
  const orders = payload.orders.map(order => ({
    ...order,
    id: String(order.id),
    customerId: String(order.customerId),
    totalAmount: number(order.totalAmount),
  }));
  const orderIdsByCustomer = new Map();
  orders.forEach(order => {
    const customerOrders = orderIdsByCustomer.get(order.customerId) || [];
    customerOrders.push(order);
    orderIdsByCustomer.set(order.customerId, customerOrders);
  });
  const partners = customers
    .filter(customer => String(customer.type).toLowerCase() === 'wholesale')
    .map(customer => {
      const customerOrders = orderIdsByCustomer.get(customer.id) || [];
      const latestOrder = customerOrders.reduce(
        (latest, order) =>
          !latest ||
          new Date(order.createdAt || 0) > new Date(latest.createdAt || 0)
            ? order
            : latest,
        null,
      );
      return {
        ...customer,
        owner: customer.contactPerson || customer.phone || customer.email || 'Wholesale account',
        area: [customer.city, customer.state].filter(Boolean).join(', ') || customer.address || 'Location not provided',
        type: 'Wholesale',
        status: customer.status || 'Active',
        due: customer.outstandingAmount,
        order: latestOrder?.totalAmount || 0,
        lastOrderAt: latestOrder?.createdAt || customer.lastOrderAt || null,
        orderCount: customerOrders.length,
      };
    });

  const productStocks = new Map();
  const preferredBatches = new Map();
  if (Array.isArray(payload.inventoryBatches)) {
    payload.inventoryBatches.forEach(batch => {
      const productId = String(batch.productId);
      productStocks.set(
        productId,
        (productStocks.get(productId) || 0) + number(batch.quantity),
      );
      const currentBatch = preferredBatches.get(productId);
      if (!currentBatch || number(batch.quantity) > number(currentBatch.quantity)) {
        preferredBatches.set(productId, batch);
      }
    });
  }
  const products = payload.products.map(product => {
    const preferredBatch = preferredBatches.get(String(product.id));
    const normalizedProduct = normalizeProduct(product);
    return {
      ...normalizedProduct,
      wholesalePrice: number(preferredBatch?.wholesalePrice) || normalizedProduct.wholesalePrice,
      batchNumber: preferredBatch?.batchNumber || '',
      mfd: preferredBatch?.mfd || null,
      expiry: preferredBatch?.expiry || null,
      stock: productStocks.has(String(product.id))
        ? productStocks.get(String(product.id))
        : null,
    };
  });

  const orderItemsByOrderId = new Map();
  payload.orderItems.forEach(item => {
    const orderId = String(item.orderId);
    orderItemsByOrderId.set(orderId, (orderItemsByOrderId.get(orderId) || 0) + 1);
  });
  const ordersWithCustomers = orders
    .map(order => {
      const tracking = payload.orderTracking
        .filter(event => String(event.orderId) === order.id)
        .sort((left, right) => new Date(left.timestamp) - new Date(right.timestamp));
      return {
        ...order,
        currentStatus: getCurrentOrderStatus(order, tracking),
        customer: customersById.get(order.customerId) || null,
        itemCount: orderItemsByOrderId.get(order.id) || 0,
        tracking,
      };
    })
    .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));

  return { customers, partners, products, orders: ordersWithCustomers };
}

export async function fetchPartnerWorkspace({ signal } = {}) {
  const payload = await request(
    '/pharmacy/bootstrap?sections=catalog,crm,inventory,wholesale',
    { signal },
  );
  return buildPartnerWorkspace(payload);
}

export function createWholesaleOrder(body) {
  return request('/pharmacy/orders/wholesale', { method: 'POST', body });
}

export function createWholesaleCustomer(body) {
  return request('/pharmacy/customers/wholesale', { method: 'POST', body });
}

export function updateWholesaleCustomer(id, body) {
  return request(`/pharmacy/customers/wholesale/${id}`, { method: 'PATCH', body });
}
