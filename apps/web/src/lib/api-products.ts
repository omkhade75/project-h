import { fetchApi } from './api-client';

const handleResponse = (result: any, fallback: any = []) => {
  if (result && result.success) return result.data ?? result;
  return fallback;
};

export const getProductsServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/products/list', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};

export const addProductServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/products/add', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};

export const editProductServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/products/edit', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};

export const archiveProductServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/products/archive', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};

export const getProduct360Server = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/products/360', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};

export const getProductOptionsServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/products/options', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};

export const autoCategorizeProductServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/products/auto-categorize', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};
