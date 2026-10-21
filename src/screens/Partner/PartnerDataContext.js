import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  createWholesaleCustomer,
  createWholesaleOrder,
  fetchPartnerWorkspace,
  updateWholesaleCustomer,
} from '../../api/partner';

const PartnerDataContext = createContext(null);
const EMPTY_WORKSPACE = {
  customers: [],
  partners: [],
  products: [],
  orders: [],
};

export function PartnerDataProvider({ children }) {
  const [workspace, setWorkspace] = useState(EMPTY_WORKSPACE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);

  const refresh = useCallback(async signal => {
    setLoading(true);
    setError('');
    try {
      const nextWorkspace = await fetchPartnerWorkspace({ signal });
      setWorkspace(nextWorkspace);
      return nextWorkspace;
    } catch (loadError) {
      if (!signal?.aborted) {
        setError(loadError.message);
      }
      return null;
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal);
    return () => controller.abort();
  }, [refresh, version]);

  const submitOrder = useCallback(
    async body => {
      const createdOrder = await createWholesaleOrder(body);
      setVersion(current => current + 1);
      return createdOrder;
    },
    [],
  );

  const createPartner = useCallback(async body => {
    const customer = await createWholesaleCustomer(body);
    setVersion(current => current + 1);
    return customer;
  }, []);

  const updatePartner = useCallback(async (id, body) => {
    const customer = await updateWholesaleCustomer(id, body);
    setVersion(current => current + 1);
    return customer;
  }, []);

  const value = useMemo(
    () => ({
      ...workspace,
      loading,
      error,
      refresh: () => setVersion(current => current + 1),
      submitOrder,
      createPartner,
      updatePartner,
    }),
    [workspace, loading, error, submitOrder, createPartner, updatePartner],
  );

  return (
    <PartnerDataContext.Provider value={value}>
      {children}
    </PartnerDataContext.Provider>
  );
}

export function usePartnerData() {
  const context = useContext(PartnerDataContext);
  if (!context) {
    throw new Error('usePartnerData must be used within PartnerDataProvider.');
  }
  return context;
}
