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

// Response Interceptor: Handles automatic token refreshing on 401 errors
axiosInstance.interceptors.response.use(
    (response) => {
        // Pass through successful responses unchanged
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        
        // Check if this is a 401 error and we haven't already tried to refresh the token
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Mark this request as having attempted a retry to prevent infinite loops
            originalRequest._retry = true;
            
            try {
                // Attempt to refresh the access token using the stored refresh token
                const refreshToken = localStorage.getItem('refresh_token');
                
                // Use base axios (not axiosInstance) to avoid triggering this interceptor again
                const response = await axios.post('/api/auth/token/refresh/', {
                    refresh: refreshToken
                });
                
                // Extract the new access token from the response
                const newAccessToken = response.data.access;
                
                // Update localStorage with the new access token
                localStorage.setItem('access_token', newAccessToken);
                
                // Update the Authorization header for the original failed request
                originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
                
                // Retry the original request with the new token
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                // Token refresh failed (refresh token expired/invalid)
                console.error('Token refresh failed:', refreshError);
                
                // Clear all authentication data
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                
                // Redirect user to login page
                window.location.href = '/login';
                
                return Promise.reject(refreshError);
            }
        }
        
        // For all other errors, pass them through unchanged
        return Promise.reject(error);
    }
);

export default axiosInstance;