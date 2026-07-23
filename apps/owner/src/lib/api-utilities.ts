import { fetchApi } from './api-client';

const handleResponse = (result: any) => {
  if (result.success) return result.data ?? result;
  throw new Error(result.error || result.message || 'API request failed');
};

export const getUtilitiesServer = async (data?: any) => handleResponse(await fetchApi('/api/utilities/list', { method: 'POST', body: JSON.stringify(data?.data || data) }));
export const addUtilityReadingServer = async (data?: any) => handleResponse(await fetchApi('/api/utilities/add', { method: 'POST', body: JSON.stringify(data?.data || data) }));
export const editUtilityReadingServer = async (data?: any) => handleResponse(await fetchApi('/api/utilities/edit', { method: 'POST', body: JSON.stringify(data?.data || data) }));
export const deleteUtilityReadingServer = async (data?: any) => handleResponse(await fetchApi('/api/utilities/delete', { method: 'POST', body: JSON.stringify(data?.data || data) }));
