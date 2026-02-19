import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_KEY = import.meta.env.VITE_API_KEY || 'sakhi_secret_key_change_this';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'X-API-Key': API_KEY },
});

// ── Groups ────────────────────────────────────────────────────
export const getGroupByLeaderPhone = (phone) => api.get(`/api/groups/by-leader/${phone}`);
export const createGroup = (data) => api.post('/api/groups', data);
export const getGroup = (id) => api.get(`/api/groups/${id}`);
export const updateGroup = (id, data) => api.patch(`/api/groups/${id}`, data);

// ── Dashboard ─────────────────────────────────────────────────
export const getDashboard = (groupId) => api.get(`/api/dashboard/${groupId}`);

// ── Members ───────────────────────────────────────────────────
export const getMembers = (groupId) => api.get(`/api/members/group/${groupId}`);
export const getMember = (id) => api.get(`/api/members/${id}`);
export const createMember = (data) => api.post('/api/members', data);
export const updateMember = (id, data) => api.patch(`/api/members/${id}`, data);
export const deleteMember = (id) => api.delete(`/api/members/${id}`);

// ── Loans ─────────────────────────────────────────────────────
export const getGroupLoans = (groupId, status) =>
  api.get(`/api/loans/group/${groupId}`, { params: status ? { status } : {} });
export const approveLoan = (id) => api.patch(`/api/loans/${id}/approve`);
export const rejectLoan = (id) => api.patch(`/api/loans/${id}/reject`);

// ── Reports ───────────────────────────────────────────────────
export const downloadGroupReport = (groupId) =>
  api.get(`/api/reports/group/${groupId}`, { responseType: 'blob' });
export const downloadMemberReport = (memberId) =>
  api.get(`/api/reports/member/${memberId}`, { responseType: 'blob' });

export default api;
