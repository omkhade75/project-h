import { fetchApi } from './api-client';

const handleResponse = (result: any) => {
  if (result.success) return result.data ?? result;
  throw new Error(result.error || result.message || 'API request failed');
};

export const getSystemAdminDashboardServer = async () => handleResponse(await fetchApi('/api/admin/dashboard', { method: 'GET' }));
export const approveRegistrationServer = async (data?: any) => handleResponse(await fetchApi('/api/admin/registration/approve', { method: 'POST', body: JSON.stringify(data?.data || data) }));
export const rejectRegistrationServer = async (data?: any) => handleResponse(await fetchApi('/api/admin/registration/reject', { method: 'POST', body: JSON.stringify(data?.data || data) }));
export const suspendRegistrationServer = async (data?: any) => handleResponse(await fetchApi('/api/admin/registration/suspend', { method: 'POST', body: JSON.stringify(data?.data || data) }));
export const deleteRegistrationServer = async (data?: any) => handleResponse(await fetchApi('/api/admin/registration/delete', { method: 'POST', body: JSON.stringify(data?.data || data) }));
export const searchCompaniesServer = async () => handleResponse(await fetchApi('/api/admin/companies/search', { method: 'GET' }));
export const suspendWorkspaceServer = async (data?: any) => handleResponse(await fetchApi('/api/admin/workspace/suspend', { method: 'POST', body: JSON.stringify(data?.data || data) }));
export const reactivateWorkspaceServer = async (data?: any) => handleResponse(await fetchApi('/api/admin/workspace/reactivate', { method: 'POST', body: JSON.stringify(data?.data || data) }));
export const deleteWorkspaceServer = async (data?: any) => handleResponse(await fetchApi('/api/admin/workspace/delete', { method: 'POST', body: JSON.stringify(data?.data || data) }));
export const resetOwnerPasswordServer = async (data?: any) => handleResponse(await fetchApi('/api/admin/owner/reset-password', { method: 'POST', body: JSON.stringify(data?.data || data) }));
export const resendWelcomeEmailServer = async (data?: any) => handleResponse(await fetchApi('/api/admin/owner/resend-email', { method: 'POST', body: JSON.stringify(data?.data || data) }));
export const getAuditLogsServer = async () => handleResponse(await fetchApi('/api/admin/audit-logs', { method: 'GET' }));
export const exportWorkspaceServer = async (data?: any) => handleResponse(await fetchApi('/api/admin/workspace/export', { method: 'POST', body: JSON.stringify(data?.data || data) }));
export const importWorkspaceServer = async (data?: any) => handleResponse(await fetchApi('/api/admin/workspace/import', { method: 'POST', body: JSON.stringify(data?.data || data) }));
