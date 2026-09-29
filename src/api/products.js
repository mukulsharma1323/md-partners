import { API_URL } from './config';
import { request } from './client';
import { packaging } from './packaging';
const number = value => (Number.isFinite(Number(value)) ? Number(value) : 0);
export function normalizeProduct(product) {
  return {
    id: String(product.id),
    name: product.name || 'Unnamed medicine',
    salt: product.composition || product.salt_composition || '',
    strength: product.strength_pack_size || '',
    form: product.dosage || product.packing_type || '',
    maker: product.brand || '',
    mrp: number(product.mrp),
    cost: number(product.purchase_rate),
    ...packaging(product),
    salePrice: number(product.retail_price ?? product.mrp),
    wholesalePrice: number(product.wholesale_price ?? product.mrp),
    packingType: product.packing_type || '',
    hsn: product.hsn || product.hsn_code || '',
    gst: number(product.gst ?? product.gst_rate),
    schedule: product.schedule_type || '',
    rx:
      product.requires_prescription === true ||
      product.requires_prescription === 'true',
    imageUrl: product.photo
      ? /^https?:\/\//i.test(product.photo)
        ? product.photo
        : `${API_URL}/${product.photo.replace(/^\//, '')}`
      : null,
    catalogOnly: true,
  };
}
export async function fetchProducts({ search = '', page = 1, signal } = {}) {
  const payload = await request(
    `/products?page=${page}&limit=20&search=${encodeURIComponent(
      search.trim(),
    )}`,
    { signal },
  );
  if (!Array.isArray(payload.data)) {
    throw new Error('The server returned an invalid product list.');
  }
  return { items: payload.data.map(normalizeProduct), meta: payload.meta };
}
