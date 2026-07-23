import { fetchApi } from './api-client';

const handleResponse = (result: any) => {
  if (result.success) return result.data ?? result;
  throw new Error(result.error || result.message || 'API request failed');
};

export const createTransactionServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/transactions/create', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};

export const getTransactionsServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/transactions/list', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};
