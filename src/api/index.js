import axios from 'axios';

// Base API URL (Local or Production)
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE,
});

// Attach token if logged in
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token');
  if (token) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

// Trees
export const getTrees = (params) => api.get('/trees', { params });
export const getTree = (id) => api.get(`/trees/${id}`);
export const addTree = (data) => api.post('/trees', data);
export const updateTree = (id, data) => api.put(`/trees/${id}`, data);
export const deleteTree = (id) => api.delete(`/trees/${id}`);

export const getStats = () => api.get('/trees/stats');
export const getDetailedStats = () => api.get('/trees/stats/detailed');
export const getTreeQR = (id) => api.get(`/trees/${id}/qr`);

export const getNearbyTrees = (id, radius) =>
  api.get(`/trees/${id}/nearby`, {
    params: { radius },
  });

// Species
export const getSpecies = () => api.get('/species');
export const getSpeciesOne = (name) => api.get(`/species/${name}`);
export const addSpecies = (data) => api.post('/species', data);
export const updateSpecies = (id, data) => api.put(`/species/${id}`, data);
export const deleteSpecies = (id) => api.delete(`/species/${id}`);

// Areas
export const getAreas = () => api.get('/areas');
export const getAreaInfo = (area) =>
  api.get(`/areas/${encodeURIComponent(area)}/info`);
export const updateAreaInfo = (area, data) =>
  api.put(`/areas/${encodeURIComponent(area)}/info`, data);

// Authentication
export const login = (creds) => api.post('/auth/login', creds);
export const changePassword = (data) =>
  api.put('/auth/change-password', data);

// Images
export const getTreeImages = (id) =>
  api.get(`/trees/${id}/images`);

export const addTreeImage = (id, data) =>
  api.post(`/trees/${id}/images`, data);

export const deleteTreeImage = (id, imgId) =>
  api.delete(`/trees/${id}/images/${imgId}`);

export const uploadImage = (formData) =>
  api.post('/trees/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

// Export
export const exportCSV = () => {
  const token = localStorage.getItem('token');
  window.open(`${BASE}/trees/export/csv?token=${token}`, '_blank');
};

export const exportPDF = () => {
  const token = localStorage.getItem('token');
  window.open(`${BASE}/trees/export/pdf?token=${token}`, '_blank');
};

export default api;