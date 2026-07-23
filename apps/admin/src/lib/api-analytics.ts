import { fetchApi } from './api-client';

const handleResponse = (result: any) => {
  if (result.success) return result.data ?? result;
  throw new Error(result.error || result.message || 'API request failed');
};

export const getCommandCenterServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/analytics/command-center', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};

export const getAnomaliesServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/analytics/anomalies', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};

export const getRecommendationsServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/analytics/recommendations', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};

export const getForecastingServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/analytics/forecasting', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};

export const dispatchEodReportServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/analytics/eod-report', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};
