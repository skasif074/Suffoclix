import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'ngrok-skip-browser-warning': 'true',
  },
});

// Auto attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto logout on 401
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────
export const authAPI = {
  register: (data) => API.post('/api/auth/register', data),
  login: (data) => API.post('/api/auth/login', data),
  me: () => API.get('/api/auth/me'),
};

// ─────────────────────────────────────────────
// CONTENT / VIDEOS
// ─────────────────────────────────────────────
export const videoAPI = {
  getAll: (params) => API.get('/api/content', { params }),
  getOne: (id) => API.get(`/api/content/${id}`),
  search: (query) => API.get('/api/content', { params: { search: query } }),
  delete: (id) => API.delete(`/api/content/${id}`),
  update: (id, data) => API.patch(`/api/content/${id}`, data),
  updateThumbnail: (id, formData) => API.patch(`/api/content/${id}/thumbnail`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  uploadChunk: (formData, onProgress) =>
    API.post('/api/content/chunk', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    }),
  mergeChunks: (formData) =>
    API.post('/api/content/merge', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  cancelUpload: (uploadId) => API.delete(`/api/content/cancel/${uploadId}`),
};

// ─────────────────────────────────────────────
// PLAYLISTS
// ─────────────────────────────────────────────
export const playlistAPI = {
  getAll: () => API.get('/api/playlists'),
  getOne: (id) => API.get(`/api/playlists/${id}`),
  create: (data) => API.post('/api/playlists', data),
  addContent: (playlistId, data) => API.post(`/api/playlists/${playlistId}/add-content`, data),
  removeContent: (playlistId, contentId) => API.delete(`/api/playlists/${playlistId}/remove/${contentId}`),
  delete: (id) => API.delete(`/api/playlists/${id}`),
};

// ─────────────────────────────────────────────
// WATCH TRACKING
// ─────────────────────────────────────────────
export const watchAPI = {
  updateProgress: (data) => API.post('/api/watch/update-progress', data),
  getHistory: () => API.get('/api/watch/history'),
  getContinue: () => API.get('/api/watch/continue'),
  getProgress: (id) => API.get(`/api/watch/progress/${id}`),
  clearHistory: (id) => API.delete(`/api/watch/history/${id}`),
};

// ─────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────
export const adminAPI = {
  getStats: () => API.get('/api/admin/stats'),
  getUsers: () => API.get('/api/admin/users'),
  deleteUser: (id) => API.delete(`/api/admin/users/${id}`),
  toggleSubscription: (id, data) => API.patch(`/api/admin/users/${id}/subscription`, data),
  getSubscription: () => API.get('/api/admin/subscription'),
  updateSubscriptionPrice: (data) => API.put('/api/admin/subscription-price', data),
  googleLogin: (data) => API.post('/api/auth/google', data),
};

export const paymentAPI = {
  getPlans: () => API.get('/api/payment/plans'),
  createOrder: (data) => API.post('/api/payment/create-order', data),
  verifyPayment: (data) => API.post('/api/payment/verify', data),
  getHistory: () => API.get('/api/payment/history'),
};

export default API;
