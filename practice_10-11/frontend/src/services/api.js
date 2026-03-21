import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(error);
        }

        const response = await axios.post('http://localhost:3000/api/auth/refresh', {
          refreshToken
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 403) {
      const message = error.response?.data?.error || '';
      if (message.includes('заблокирован')) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        alert('Ваш аккаунт заблокирован');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export const api = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  refresh: (data) => apiClient.post('/auth/refresh', data),
  logout: (data) => apiClient.post('/auth/logout', data),
  getMe: () => apiClient.get('/auth/me'),
  
  getUsers: () => apiClient.get('/users'),
  getUser: (id) => apiClient.get(`/users/${id}`),
  updateUser: (id, data) => apiClient.put(`/users/${id}`, data),
  blockUser: (id) => apiClient.delete(`/users/${id}`),
  unblockUser: (id) => apiClient.post(`/users/${id}/unblock`),
  
  getProducts: () => apiClient.get('/products'),
  getProduct: (id) => apiClient.get(`/products/${id}`),
  createProduct: (data) => apiClient.post('/products', data),
  updateProduct: (id, data) => apiClient.put(`/products/${id}`, data),
  deleteProduct: (id) => apiClient.delete(`/products/${id}`),
};

export default api;