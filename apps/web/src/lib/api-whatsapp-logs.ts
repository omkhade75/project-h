import { fetchApi } from './api-client';

const handleResponse = (result: any) => {
  if (result.success) return result.data ?? result;
  throw new Error(result.error || result.message || 'API request failed');
};

export const getMessageLogsServer = async () => handleResponse(await fetchApi('/api/whatsapp/logs', { method: 'GET' }));
