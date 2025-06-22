// In src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axios'; // Add this import


const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    const logout = useCallback(() => { // Also wrap logout for consistency
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        setIsAuthenticated(false);
    }, []);


    const fetchUser = useCallback(async () => {
        try {
            const res = await axiosInstance.get('/users/me/');
            setUser(res.data);
            setIsAuthenticated(true);
        } catch (error) {
            console.log("Auth token is invalid, logging out.");
            logout(); // Call the stable logout function
        }
    }, [logout]); // The dependency is the `logout` function itself


    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            fetchUser();
        }
        setLoading(false);
    }, [fetchUser]); // <-- THE FIX: Add fetchUser to the dependency array.


    const login = useCallback((tokens) => { // Wrap login as well
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
        fetchUser(); // Fetch user on login
    }, [fetchUser]); // The dependency is fetchUser

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
// Custom hook to use the AuthContext
export const useAuth = () => {
    return useContext(AuthContext);
};