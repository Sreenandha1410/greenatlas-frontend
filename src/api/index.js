import axios from 'axios';

// Base API URL
const BASE =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

// ==================== TREES ====================

export const getTrees = (params) =>
  api.get('/trees', { params });

export const getTree = (id) =>
  api.get(`/trees/${id}`);

export const addTree = (data) =>
  api.post('/trees', data);

export const updateTree = (id, data) =>
  api.put(`/trees/${id}`, data);

export const deleteTree = (id) =>
  api.delete(`/trees/${id}`);

export const getStats = () =>
  api.get('/trees/stats');

export const getDetailedStats = () =>
  api.get('/trees/stats/detailed');

export const getTreeQR = (id) =>
  api.get(`/trees/${id}/qr`);

export const getNearbyTrees = (id, radius) =>
  api.get(`/trees/${id}/nearby`, {
    params: { radius },
  });

// ==================== SPECIES ====================

export const getSpecies = () =>
  api.get('/species');

export const getSpeciesOne = (name) =>
  api.get(`/species/${name}`);

export const addSpecies = (data) =>
  api.post('/species', data);

export const updateSpecies = (id, data) =>
  api.put(`/species/${id}`, data);

export const deleteSpecies = (id) =>
  api.delete(`/species/${id}`);

// ==================== AREAS ====================

export const getAreas = () =>
  api.get('/areas');

export const addArea = (data) =>
  api.post('/areas', data);

export const deleteArea = (area) =>
  api.delete(`/areas/${encodeURIComponent(area)}`);

export const getAreaInfo = (area) =>
  api.get(`/areas/${encodeURIComponent(area)}/info`);

export const updateAreaInfo = (area, data) =>
  api.put(`/areas/${encodeURIComponent(area)}/info`, data);

// ==================== AUTHENTICATION ====================

export const login = (creds) =>
  api.post('/auth/login', creds);

export const changePassword = (data) =>
  api.put('/auth/change-password', data);

// ==================== IMAGES ====================

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

// ==================== COMPLAINTS ====================

export const uploadComplaintImage = (formData) =>
  api.post('/complaints/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

export const submitComplaint = (data) =>
  api.post('/complaints', data);

export const getComplaints = () =>
  api.get('/complaints');

export const updateComplaintStatus = (id, data) =>
  api.put(`/complaints/${id}/status`, data);

// ==================== EXPORT ====================

export const exportCSV = async (params = {}) => {
  const response = await api.get('/trees/export/csv', {
    params,
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'campus_trees.csv');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const exportPDF = async (params = {}) => {
  const response = await api.get('/trees/export/pdf', {
    params,
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'campus_trees.pdf');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const exportTable = async (tableName, format = 'csv') => {
  const response = await api.get(`/trees/export/table/${encodeURIComponent(tableName)}`, {
    params: { format },
    responseType: 'blob'
  });
  const mimeType = format === 'json' ? 'application/json' : 'text/csv';
  const url = window.URL.createObjectURL(new Blob([response.data], { type: mimeType }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `green_atlas_${tableName}.${format}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};


// ==================== VIEWS ====================

export const recordView = (path) =>
  api.post('/trees/views', { path });

export const getViewCount = () =>
  api.get('/trees/views');

// ==================== MAP EDITOR ====================


// Add to frontend/src/api/index.js. Reuse your existing Axios instance `api`.
export const updateTreeLocation = (id, coordinates) =>
  api.patch(`/trees/${encodeURIComponent(id)}/location`, coordinates);
export const getTreeLocationHistory = (id, params = {}) =>
  api.get(`/trees/${encodeURIComponent(id)}/location-history`, { params });
export const getRecentLocationUpdates = (limit = 20) =>
  api.get('/trees/location-history/recent', { params: { limit } });
export const undoTreeLocation = id =>
  api.post(`/trees/${encodeURIComponent(id)}/location/undo`);
export const exportLocationHistory = () =>
  api.get('/trees/location-history/export/csv', { responseType: 'blob' });



export default api;
