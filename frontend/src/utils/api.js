import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Subscriptions
export const getSubscriptions = async () => {
  const response = await axios.get(`${API_URL}/api/subscriptions`);
  return response.data;
};

export const getSubscription = async (id) => {
  const response = await axios.get(`${API_URL}/api/subscriptions/${id}`);
  return response.data;
};

export const createSubscription = async (data) => {
  const response = await axios.post(`${API_URL}/api/subscriptions`, data);
  return response.data;
};

export const updateSubscription = async (id, data) => {
  const response = await axios.put(`${API_URL}/api/subscriptions/${id}`, data);
  return response.data;
};

export const deleteSubscription = async (id) => {
  const response = await axios.delete(`${API_URL}/api/subscriptions/${id}`);
  return response.data;
};

export const importSubscriptions = async (subscriptions) => {
  const response = await axios.post(`${API_URL}/api/subscriptions/import`, {
    subscriptions
  });
  return response.data;
};

export const exportSubscriptions = async () => {
  const response = await axios.get(`${API_URL}/api/subscriptions/export/csv`, {
    responseType: 'blob'
  });
  return response.data;
};

// Analytics
export const getAnalyticsOverview = async () => {
  const response = await axios.get(`${API_URL}/api/analytics/overview`);
  return response.data;
};

export const getSpendingByCategory = async () => {
  const response = await axios.get(`${API_URL}/api/analytics/by-category`);
  return response.data;
};

export const getDeadWeight = async () => {
  const response = await axios.get(`${API_URL}/api/analytics/dead-weight`);
  return response.data;
};

export const getSpendingTrends = async (months = 6) => {
  const response = await axios.get(`${API_URL}/api/analytics/trends?months=${months}`);
  return response.data;
};

export const getRecommendations = async () => {
  const response = await axios.get(`${API_URL}/api/analytics/recommendations`);
  return response.data;
};

// User
export const getUserSettings = async () => {
  const response = await axios.get(`${API_URL}/api/users/settings`);
  return response.data;
};

export const updateUserSettings = async (settings) => {
  const response = await axios.put(`${API_URL}/api/users/settings`, settings);
  return response.data;
};

export const updateUserProfile = async (profile) => {
  const response = await axios.put(`${API_URL}/api/users/profile`, profile);
  return response.data;
};

export const getUserStats = async () => {
  const response = await axios.get(`${API_URL}/api/users/stats`);
  return response.data;
};
