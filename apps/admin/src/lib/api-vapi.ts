import { fetchApi } from './api-client';

const handleResponse = (result: any) => {
  if (result.success) return result.data ?? result;
  throw new Error(result.error || result.message || 'API request failed');
};

export const getVapiConfigServer = async () => handleResponse(await fetchApi('/api/vapi/config', { method: 'GET' }));
export const updateVapiConfigServer = async (data?: any) => handleResponse(await fetchApi('/api/vapi/config/update', { method: 'POST', body: JSON.stringify(data?.data || data) }));
export const initiateVapiCallServer = async (data?: any) => handleResponse(await fetchApi('/api/vapi/call', { method: 'POST', body: JSON.stringify(data?.data || data) }));
