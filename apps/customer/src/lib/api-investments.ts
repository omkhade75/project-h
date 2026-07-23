import { fetchApi } from './api-client';

const handleResponse = (result: any, fallback: any = []) => {
  if (result && result.success) return result.data ?? result;
  return fallback;
};

export const getInvestmentsServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/investments/list', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};

export const investCorporateCashServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/investments/invest', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};

export const liquidateInvestmentServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/investments/liquidate', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};

export const getLiveMarketDataServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/investments/market-data', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};
