import { fetchApi } from './api-client';

const handleResponse = (result: any) => {
  if (result.success) return result.data ?? result;
  throw new Error(result.error || result.message || 'API request failed');
};

export const getAccountsDataServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/accounts/data', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};

export const createFixedDepositServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/accounts/fd/create', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};

export const createCorporateLoanServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/accounts/loan/create', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};

export const repayLoanServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/accounts/loan/repay', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};

export const payPurchaseOrderServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/accounts/po/pay', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};
