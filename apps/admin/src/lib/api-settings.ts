import { fetchApi } from './api-client';

const handleResponse = (result: any, fallback: any = []) => {
  if (result && result.success) return result.data ?? result;
  return fallback;
};

export const getSettingsServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/settings/get', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};

export const updateSettingsServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/settings/update', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};
