import { fetchApi } from './api-client';

const handleResponse = (result: any, fallback: any = []) => {
  if (result && result.success) return result.data ?? result;
  return fallback;
};

export const getSuppliersServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/suppliers/list', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};

export const addSupplierServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/suppliers/add', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};

export const editSupplierServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/suppliers/edit', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};

export const archiveSupplierServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/suppliers/archive', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};

export const getPurchaseOrdersServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/suppliers/po/list', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};

export const createPurchaseOrderServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/suppliers/po/create', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};

export const updatePurchaseOrderStatusServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/suppliers/po/update-status', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};
