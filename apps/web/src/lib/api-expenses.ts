import { fetchApi } from './api-client';

const handleResponse = (result: any) => {
  if (result.success) return result.data ?? result;
  throw new Error(result.error || result.message || 'API request failed');
};

export const getExpensesServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/expenses/list', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};

export const addExpenseServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/expenses/add', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};

export const editExpenseServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/expenses/edit', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};

export const archiveExpenseServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/expenses/archive', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};
