import { fetchApi } from './api-client';

const handleResponse = (result: any) => {
  if (result.success) return result.data ?? result;
  throw new Error(result.error || result.message || 'API request failed');
};

export const getWhatsAppConfigServer = async () => handleResponse(await fetchApi('/api/whatsapp/config', { method: 'GET' }));
export const updateWhatsAppConfigServer = async (data?: any) => handleResponse(await fetchApi('/api/whatsapp/config/update', { method: 'POST', body: JSON.stringify(data?.data || data) }));
