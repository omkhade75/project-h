import { fetchApi } from './api-client';

const handleResponse = (result: any, fallback: any = []) => {
  if (result && result.success) return result.data ?? result;
  return fallback;
};

export const createTransactionServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  const result = await fetchApi('/api/transactions', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined });
  if (result && result.success) {
    const rawData = result.data || {};
    const txn = rawData.transaction || (rawData.id ? rawData : rawData);
    return {
      success: true,
      transaction: txn,
      data: txn,
      ...rawData,
    };
  }
  return {
    success: false,
    error: result?.message || result?.error || 'Transaction failed',
    message: result?.message || result?.error || 'Transaction failed',
  };
};

export const getTransactionsServer = async (data?: any) => {
  return handleResponse(await fetchApi('/api/transactions', { method: 'GET' }));
};
