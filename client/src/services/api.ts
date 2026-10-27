const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('campus_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const contentType = res.headers.get('content-type');
  let data: any = null;
  if (contentType && contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const errorMsg = data?.error || data?.message || 'Request failed';
    if (
      (res.status === 401 || (res.status === 403 && ['STAFF_SUSPENDED', 'STAFF_BANNED', 'STAFF_DELETED'].includes(data?.code))) &&
      !endpoint.includes('/auth/login') &&
      !endpoint.includes('/auth/staff/login') &&
      !endpoint.includes('/auth/admin/login')
    ) {
      localStorage.removeItem('campus_token');
    }
    throw new ApiError(errorMsg, res.status, data);
  }

  return data as T;
}

function cleanParams(params?: Record<string, any>): string {
  if (!params) return '';
  const cleaned: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') {
      cleaned[k] = String(v);
    }
  }
  const qs = new URLSearchParams(cleaned).toString();
  return qs ? `?${qs}` : '';
}

export const api = {
  // Auth
  studentRegister: (payload: any) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  studentLogin: (payload: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  staffRegister: (payload: any) => request('/auth/staff/register', { method: 'POST', body: JSON.stringify(payload) }),
  staffLogin: (payload: any) => request('/auth/staff/login', { method: 'POST', body: JSON.stringify(payload) }),
  adminLogin: (payload: any) => request('/auth/admin/login', { method: 'POST', body: JSON.stringify(payload) }),
  forgotPassword: (payload: any) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify(payload) }),
  resetPassword: (payload: any) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
  verifyOtp: (payload: { email: string; otp: string }) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify(payload) }),
  resendOtp: (payload: { email: string }) => request('/auth/resend-otp', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request('/auth/me'),

  // Events
  getEvents: (params?: Record<string, any>) => request(`/events${cleanParams(params)}`),
  getEvent: (id: string) => request(`/events/${id}`),
  createEvent: (payload: any) => request('/events', { method: 'POST', body: JSON.stringify(payload) }),
  updateEvent: (id: string, payload: any) => request(`/events/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteEvent: (id: string) => request(`/events/${id}`, { method: 'DELETE' }),
  getMyStaffEvents: () => request('/events/my/staff'),

  // Registrations & Passes
  registerForEvent: (eventId: string) => request(`/events/${eventId}/register`, { method: 'POST' }),
  getMyRegistrations: () => request('/registrations/my'),
  getPass: (regId: string) => request(`/registrations/pass/${regId}`),
  cancelRegistration: (regId: string) => request(`/registrations/${regId}/cancel`, { method: 'POST' }),
  getEventRegistrations: (eventId: string) => request(`/registrations/event/${eventId}`),
  getAllRegistrations: (params?: Record<string, any>) => request(`/registrations/all${cleanParams(params)}`),

  // Attendance
  verifyAttendance: (payload: any) => request('/attendance/verify', { method: 'POST', body: JSON.stringify(payload) }),
  getMyAttendance: () => request('/attendance/my'),
  getEventAttendance: (eventId: string) => request(`/attendance/event/${eventId}`),
  getAllAttendance: (params?: Record<string, any>) => request(`/attendance/all${cleanParams(params)}`),

  // Feedback
  submitFeedback: (payload: any) => request('/feedback', { method: 'POST', body: JSON.stringify(payload) }),
  getEventFeedback: (eventId: string) => request(`/feedback/event/${eventId}`),
  getAllFeedback: (params?: Record<string, any>) => request(`/feedback/all${cleanParams(params)}`),

  // Certificates
  getMyCertificates: () => request('/certificates/my'),
  verifyCertificateNumber: (certNumber: string) => request(`/certificates/verify/${certNumber}`),
  issueCertificate: (payload: any) => request('/certificates/issue', { method: 'POST', body: JSON.stringify(payload) }),
  bulkIssueCertificates: (eventId: string) => request(`/certificates/bulk-issue/${eventId}`, { method: 'POST' }),
  getEventCertificates: (eventId: string) => request(`/certificates/event/${eventId}`),
  getAllCertificates: (params?: Record<string, any>) => request(`/certificates/all${cleanParams(params)}`),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id: string) => request(`/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'POST' }),

  // Profiles
  updateProfile: (payload: any) => request('/profile/update', { method: 'PUT', body: JSON.stringify(payload) }),
  changePassword: (payload: any) => request('/profile/change-password', { method: 'POST', body: JSON.stringify(payload) }),

  // Administration
  listStaff: (params?: Record<string, any>) => request(`/admin/staff${cleanParams(params)}`),
  approveStaff: (userId: string) => request(`/admin/staff/${userId}/approve`, { method: 'POST' }),
  rejectStaff: (userId: string, reason?: string) => request(`/admin/staff/${userId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  suspendStaff: (userId: string, reason?: string) => request(`/admin/staff/${userId}/suspend`, { method: 'POST', body: JSON.stringify({ reason }) }),
  unsuspendStaff: (userId: string, reason?: string) => request(`/admin/staff/${userId}/unsuspend`, { method: 'POST', body: JSON.stringify({ reason }) }),
  banStaff: (userId: string, reason: string) => request(`/admin/staff/${userId}/ban`, { method: 'POST', body: JSON.stringify({ reason }) }),
  unbanStaff: (userId: string, reason?: string) => request(`/admin/staff/${userId}/unban`, { method: 'POST', body: JSON.stringify({ reason }) }),
  deleteStaff: (userId: string, payload: { confirmation: string; reason: string }) => request(`/admin/staff/${userId}/delete`, { method: 'POST', body: JSON.stringify(payload) }),
  getAuditLogs: () => request('/admin/audit-logs'),
  getAdminReports: () => request('/admin/reports'),

  // Academic Departments & Department-wise Staff Management
  getDepartments: () => request('/departments'),
  getAdminDepartments: () => request('/admin/departments'),
  createDepartment: (payload: { code: string; name: string; description?: string }) => request('/admin/departments', { method: 'POST', body: JSON.stringify(payload) }),
  updateDepartment: (id: string, payload: { code?: string; name?: string; description?: string; is_active?: boolean | number }) => request(`/admin/departments/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  getDepartmentStaff: (departmentId: string, params?: Record<string, any>) => request(`/admin/departments/${departmentId}/staff${cleanParams(params)}`),
  transferStaffDepartment: (userId: string, payload: { destinationDepartmentId: string; reason: string }) => request(`/admin/staff/${userId}/transfer-department`, { method: 'POST', body: JSON.stringify(payload) }),
  getStaffTransferHistory: (userId: string) => request(`/admin/staff/${userId}/transfer-history`)
};
