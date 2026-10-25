import { fetchApi } from './api-client';

const handleResponse = (result: any, fallback: any = []) => {
  if (result && result.success) return result.data ?? result;
  return fallback;
};

export const getVapiConfigServer = async () => handleResponse(await fetchApi('/api/comms/vapi/config', { method: 'GET' }));
export const updateVapiConfigServer = async (data?: any) => handleResponse(await fetchApi('/api/comms/vapi/config', { method: 'POST', body: JSON.stringify(data?.data || data) }));
export const initiateVapiCallServer = async (data?: any) => {
  try {
    const res = await fetchApi('/api/comms/vapi/call', { method: 'POST', body: JSON.stringify(data?.data || data) });
    if (res && typeof res.success === 'boolean') return res;
    if (res && res.data) return { success: true, ...res.data };
    return res ?? { success: false, error: 'Empty response from backend server' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to reach backend comms API' };
  }
};
