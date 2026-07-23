import { fetchApi } from './api-client';

const handleResponse = (result: any, fallback: any = []) => {
  if (result && result.success) return result.data ?? result;
  return fallback;
};

export const getPaymentReportsServer = async (data?: any) => handleResponse(await fetchApi('/api/reports/payments', { method: 'POST', body: JSON.stringify(data?.data || data) }));
export const sendAllReportsWhatsAppServer = async (data?: any) => handleResponse(await fetchApi('/api/reports/whatsapp/send', { method: 'POST', body: JSON.stringify(data?.data || data) }));
