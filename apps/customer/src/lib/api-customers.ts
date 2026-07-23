import { fetchApi } from './api-client';

const handleResponse = (result: any) => {
  if (result.success) return result.data ?? result;
  throw new Error(result.error || result.message || 'API request failed');
};

export const getCustomersServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/customers/list', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};

export const addCustomerServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/customers/add', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};

export const editCustomerServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/customers/edit', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};

export const archiveCustomerServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/customers/archive', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};

export const getCustomer360Server = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/customers/360', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};
