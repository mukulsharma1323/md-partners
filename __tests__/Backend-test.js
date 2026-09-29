import { request, setSession } from '../src/api/client';
import { fetchProducts, normalizeProduct } from '../src/api/products';
import { API_URL } from '../src/api/config';
const response = (status, payload) => ({
  ok: status < 400,
  status,
  json: async () => payload,
});
beforeEach(() => {
  global.fetch = jest.fn();
  setSession(null);
});
afterEach(() => jest.restoreAllMocks());
it('posts the backend email/password contract without a bearer header', async () => {
  fetch.mockResolvedValue(response(200, { access_token: 'test-token' }));
  await request('/login', {
    method: 'POST',
    authenticated: false,
    body: { email: 'staff@example.com', password: 'test-password' },
  });
  const [url, options] = fetch.mock.calls[0];
  expect(url).toBe(`${API_URL}/login`);
  expect(JSON.parse(options.body)).toEqual({
    email: 'staff@example.com',
    password: 'test-password',
  });
  expect(options.headers.Authorization).toBeUndefined();
});
it('loads authenticated products with encoded search and pagination', async () => {
  setSession('test-token');
  fetch.mockResolvedValue(
    response(200, {
      data: [
        { id: 42, name: 'Medicine', mrp: '12.50', photo: '/uploads/a.jpg' },
      ],
      meta: { hasNextPage: true },
    }),
  );
  const result = await fetchProducts({ search: 'A & B', page: 2 });
  expect(fetch.mock.calls[0][0]).toContain(
    'page=2&limit=20&search=A%20%26%20B',
  );
  expect(fetch.mock.calls[0][1].headers.Authorization).toBe(
    'Bearer test-token',
  );
  expect(result.items[0]).toMatchObject({
    id: '42',
    mrp: 12.5,
    imageUrl: `${API_URL}/uploads/a.jpg`,
    catalogOnly: true,
  });
  expect(result.items[0].stock).toBeUndefined();
});
it('invalidates expired sessions but preserves permission errors', async () => {
  const expire = jest.fn();
  setSession('test-token', expire);
  fetch.mockResolvedValueOnce(response(403, { message: 'Forbidden' }));
  await expect(request('/products')).rejects.toThrow('Forbidden');
  expect(expire).not.toHaveBeenCalled();
  fetch.mockResolvedValueOnce(response(401, { message: 'Unauthorized' }));
  await expect(request('/products')).rejects.toThrow('Unauthorized');
  expect(expire).toHaveBeenCalledTimes(1);
});
it('rejects missing sessions, invalid product payloads and reports network failures', async () => {
  await expect(request('/products')).rejects.toThrow('sign in');
  expect(fetch).not.toHaveBeenCalled();
  setSession('token');
  fetch.mockResolvedValueOnce(response(200, {}));
  await expect(fetchProducts()).rejects.toThrow('invalid product list');
  fetch.mockRejectedValueOnce(new TypeError('Network request failed'));
  await expect(fetchProducts()).rejects.toThrow('Cannot connect');
});
it('normalizes medicine fields without inventing stock or expiry', () => {
  expect(
    normalizeProduct({
      id: 1,
      salt_composition: 'Salt',
      units_per_strip: 10,
      requires_prescription: 'false',
    }),
  ).toMatchObject({ id: '1', salt: 'Salt', pack: 10, rx: false });
});
