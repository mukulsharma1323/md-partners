import { request } from './client';
import { normalizeProduct } from './products';

export const MAX_PRESCRIPTION_BYTES = 3 * 1024 * 1024;
export async function scanPrescription(file, signal) {
  if (!file?.uri) {
    throw new Error('Choose a prescription first.');
  }
  if (file.size > MAX_PRESCRIPTION_BYTES) {
    throw new Error('Prescription must be 3 MB or smaller.');
  }
  const body = new FormData();
  body.append('prescription', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  });
  const result = await request('/prescriptions/extract', {
    method: 'POST',
    body,
    multipart: true,
    timeoutMs: 90000,
    signal,
  });
  if (!Array.isArray(result.medicines)) {
    throw new Error('The scanner returned an invalid result. Please retry.');
  }
  return result.medicines.map(row => ({
    ...row,
    quantity: row.quantity == null ? '' : String(row.quantity),
    product: row.match ? normalizeProduct(row.match) : null,
    candidates: (row.candidates || []).map(normalizeProduct),
    reviewStatus: 'pending',
  }));
}
