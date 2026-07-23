import { fetchApi } from './api-client';

const handleResponse = (result: any, fallback: any = []) => {
  if (result && result.success) return result.data ?? result;
  return fallback;
};

export const getStaffServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/staff/list', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};

export const addStaffServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/staff/add', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};

export const editStaffServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/staff/edit', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};

export const archiveStaffServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/staff/archive', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};

export const updateStaffStatusServer = async (data?: any) => {
  const payload = data?.data ? data.data : data;
  return handleResponse(await fetchApi('/api/staff/update-status', { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }));
};
