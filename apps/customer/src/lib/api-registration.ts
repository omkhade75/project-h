import { fetchApi } from './api-client';

const handleResponse = (result: any) => {
  if (result.success) return result.data ?? result;
  throw new Error(result.error || result.message || 'API request failed');
};

export const registerCompanyServer = async (data?: any) => handleResponse(await fetchApi('/api/registration/register', { method: 'POST', body: JSON.stringify(data?.data || data) }));
