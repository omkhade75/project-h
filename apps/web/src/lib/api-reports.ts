import { fetchApi } from './api-client';

const handleResponse = (result: any) => {
  if (result.success) return result.data ?? result;
  throw new Error(result.error || result.message || 'API request failed');
};

export const getPaymentReportsServer = async (data?: any) => handleResponse(await fetchApi('/api/reports/payments', { method: 'POST', body: JSON.stringify(data?.data || data) }));
export const sendAllReportsWhatsAppServer = async (data?: any) => handleResponse(await fetchApi('/api/reports/whatsapp/send', { method: 'POST', body: JSON.stringify(data?.data || data) }));
