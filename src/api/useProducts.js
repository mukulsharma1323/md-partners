import { useEffect, useRef, useState } from 'react';
import { fetchProducts } from './products';

export default function useProducts(search) {
  const [result, setResult] = useState({
    items: [],
    meta: null,
    loading: true,
    error: '',
  });
  const [version, setVersion] = useState(0);
  const active = useRef(null);
  const generation = useRef(0);
  const page = useRef(0);
  const pending = useRef(false);
  useEffect(() => {
    const current = ++generation.current;
    active.current?.abort();
    page.current = 0;
    pending.current = false;
    setResult({ items: [], meta: null, loading: true, error: '' });
    const timer = setTimeout(() => load(1, current), 300);
    return () => {
      clearTimeout(timer);
      generation.current = current + 1;
      active.current?.abort();
    };
    // A search/refresh owns its request generation; old responses are ignored.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, version]);
  async function load(nextPage, current = generation.current) {
    if (pending.current) {
      return;
    }
    pending.current = true;
    const controller = new AbortController();
    active.current = controller;
    setResult(previous => ({ ...previous, loading: true, error: '' }));
    try {
      const response = await fetchProducts({
        search,
        page: nextPage,
        signal: controller.signal,
      });
      if (current !== generation.current) {
        return;
      }
      page.current = nextPage;
      setResult(previous => ({
        items:
          nextPage === 1
            ? response.items
            : [
                ...new Map(
                  [...previous.items, ...response.items].map(item => [
                    item.id,
                    item,
                  ]),
                ).values(),
              ],
        meta: response.meta,
        loading: false,
        error: '',
      }));
    } catch (error) {
      if (current === generation.current) {
        setResult(previous => ({
          ...previous,
          loading: false,
          error: error.message,
        }));
      }
    } finally {
      if (current === generation.current) {
        pending.current = false;
      }
    }
  }
  return {
    ...result,
    refresh: () => setVersion(v => v + 1),
    loadMore: () => load(page.current + 1),
    retry: () => load(page.current + 1),
  };
}
