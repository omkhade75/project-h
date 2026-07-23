import { fetchApi } from './api-client';

const handleResponse = (result: any, fallback: any = []) => {
  if (result && result.success) return result.data ?? result;
  return fallback;
};

export const getLogisticsDispatchesServer = async (data?: any) => handleResponse(await fetchApi('/api/logistics/dispatches', { method: 'POST', body: JSON.stringify(data?.data || data) }));
export const createLogisticsDispatchServer = async (data?: any) => handleResponse(await fetchApi('/api/logistics/dispatch/create', { method: 'POST', body: JSON.stringify(data?.data || data) }));
export const updateLogisticsStatusServer = async (data?: any) => handleResponse(await fetchApi('/api/logistics/dispatch/update', { method: 'POST', body: JSON.stringify(data?.data || data) }));
