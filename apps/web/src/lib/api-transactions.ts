import { fetchApi } from './api-client';

const handleResponse = (result: any, fallback: any = []) => {
  if (result && result.success) return result.data ?? result;
  return fallback;
};

export const createTransactionServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/transactions/create', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};

export const getTransactionsServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/transactions/list', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};
