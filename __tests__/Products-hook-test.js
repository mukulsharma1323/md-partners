import React from 'react';
import renderer, { act } from 'react-test-renderer';
import useProducts from '../src/api/useProducts';
import { fetchProducts } from '../src/api/products';
jest.mock('../src/api/products', () => ({ fetchProducts: jest.fn() }));
let state;
let tree;
function Harness({ search }) {
  state = useProducts(search);
  return null;
}
const flushSearch = async () => {
  await act(async () => {
    jest.advanceTimersByTime(300);
  });
};
beforeEach(() => {
  jest.useFakeTimers();
  fetchProducts.mockReset();
});
afterEach(() => {
  act(() => tree.unmount());
  jest.useRealTimers();
});
it('ignores stale search results and appends the next page without duplicates', async () => {
  let oldResult;
  fetchProducts.mockImplementationOnce(
    () =>
      new Promise(resolve => {
        oldResult = resolve;
      }),
  );
  act(() => {
    tree = renderer.create(<Harness search="old" />);
  });
  await flushSearch();
  fetchProducts.mockResolvedValueOnce({
    items: [{ id: 'new' }],
    meta: { hasNextPage: true },
  });
  act(() => tree.update(<Harness search="new" />));
  await flushSearch();
  await act(async () => {
    oldResult({ items: [{ id: 'old' }], meta: {} });
  });
  expect(state.items).toEqual([{ id: 'new' }]);
  fetchProducts.mockResolvedValueOnce({
    items: [{ id: 'new' }, { id: 'next' }],
    meta: { hasNextPage: false },
  });
  await act(async () => {
    await state.loadMore();
  });
  expect(fetchProducts).toHaveBeenLastCalledWith(
    expect.objectContaining({ search: 'new', page: 2 }),
  );
  expect(state.items).toEqual([{ id: 'new' }, { id: 'next' }]);
});
it('retries failed pages instead of skipping medicines', async () => {
  fetchProducts.mockRejectedValueOnce(new Error('Offline'));
  act(() => {
    tree = renderer.create(<Harness search="" />);
  });
  await flushSearch();
  expect(state.error).toBe('Offline');
  fetchProducts.mockResolvedValueOnce({
    items: [],
    meta: { hasNextPage: false },
  });
  await act(async () => {
    await state.retry();
  });
  expect(fetchProducts).toHaveBeenLastCalledWith(
    expect.objectContaining({ page: 1 }),
  );
  expect(state.error).toBe('');
});
