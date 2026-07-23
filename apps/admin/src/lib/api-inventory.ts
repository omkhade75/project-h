import { fetchApi } from './api-client';

const handleResponse = (result: any) => {
  if (result.success) return result.data ?? result;
  throw new Error(result.error || result.message || 'API request failed');
};

export const getInventoryStockServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/inventory/stock', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};

export const getInventoryMovementsServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/inventory/movements', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};

export const mutateInventoryServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/inventory/mutate', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};

export const getExpiryIntelligenceServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/inventory/expiry', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};
