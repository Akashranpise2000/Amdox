import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  changePassword: (currentPassword, newPassword) => api.put('/auth/change-password', { currentPassword, newPassword }),
  saveJob: (jobId) => api.post(`/auth/saved-jobs/${jobId}`),
  unsaveJob: (jobId) => api.delete(`/auth/saved-jobs/${jobId}`),
  getSavedJobs: () => api.get('/auth/saved-jobs')
};

export const profileAPI = {
  getProfile: () => api.get('/profile'),
  getProfileById: (userId) => api.get(`/profile/${userId}`),
  updateProfile: (data) => api.put('/profile', data),
  uploadResume: (file) => {
    const formData = new FormData();
    formData.append('resume', file);
    return api.post('/profile/resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export const jobsAPI = {
  getJobs: (params) => api.get('/jobs', { params }),
  getJob: (id) => api.get(`/jobs/${id}`),
  getMyListings: () => api.get('/jobs/my-listings'),
  getFeatured: () => api.get('/jobs/featured'),
  getRecent: () => api.get('/jobs/recent'),
  getStats: () => api.get('/jobs/stats'),
  createJob: (data) => api.post('/jobs', data),
  updateJob: (id, data) => api.put(`/jobs/${id}`, data),
  deleteJob: (id) => api.delete(`/jobs/${id}`)
};

export const applicationsAPI = {
  apply: (data) => api.post('/applications', data),
  getMyApplications: (params) => api.get('/applications/seeker', { params }),
  getMyStats: () => api.get('/applications/seeker/stats'),
  getJobApplications: (jobId, params) => api.get(`/applications/job/${jobId}`, { params }),
  updateStatus: (id, data) => api.put(`/applications/${id}/status`, data),
  getApplication: (id) => api.get(`/applications/${id}`),
  withdraw: (id) => api.delete(`/applications/${id}`)
};

export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
  deleteAll: () => api.delete('/notifications')
};

export const dashboardAPI = {
  getSeeker: () => api.get('/dashboard/seeker'),
  getEmployer: () => api.get('/dashboard/employer'),
  getAdmin: () => api.get('/dashboard/admin'),
  getActivity: (params) => api.get('/dashboard/activity', { params })
};

export const certificatesAPI = {
  search: (id) => api.get(`/certificates/search/${id}`),
  getPDF: (id) => {
    window.open(`${API_BASE_URL}/certificates/${id}/pdf`, '_blank');
  },
  getAll: (params) => api.get('/certificates', { params }),
  delete: (id) => api.delete(`/certificates/${id}`)
};

export const uploadAPI = {
  uploadCertificates: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/certificates', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getLogs: (params) => api.get('/upload/logs', { params }),
  getLogById: (id) => api.get(`/upload/logs/${id}`)
};

export const healthCheck = () => api.get('/health');

export default api;
