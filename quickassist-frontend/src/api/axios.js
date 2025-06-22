// In src/api/axios.js
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api/';

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
});

// Request Interceptor: Injects the auth token into every request
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers['Authorization'] = 'Bearer ' + token;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// TODO: Add a Response Interceptor here later to handle token refreshing

export default axiosInstance;