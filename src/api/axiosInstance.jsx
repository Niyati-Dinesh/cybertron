import axios from 'axios';
import { toast } from 'react-hot-toast';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000/api/routes/',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 1000 * 60 * 3, // 10 second timeout
});

// Attach token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers['authtoken'] = token;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Handle responses and errors globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Response error:', error);
    
    // Network error (server not reachable)
    if (!error.response) {
      toast.error("Network error. Please check if the server is running.");
      return Promise.reject(error);
    }
    
    // Handle specific status codes
    if (error.response.status === 401) {
      toast.error("Session expired. Please log in again.");
      // sessionStorage.removeItem('token');
      // sessionStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;