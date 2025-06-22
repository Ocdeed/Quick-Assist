// In src/pages/LoginPage.js
import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, Button, TextField, Typography, Alert, Link } from '@mui/material';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../api/axios';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(''); // Clear previous errors
        try {
            const response = await axiosInstance.post('/auth/token/', {
                username,
                password,
            });
            login(response.data); // response.data contains access and refresh tokens
            navigate('/'); // Redirect to homepage on successful login
        } catch (err) {
            if (err.response && err.response.data) {
                setError(err.response.data.detail || 'Failed to log in. Please check your credentials.');
            } else {
                setError('An unknown error occurred.');
            }
        }
    };

    return (
        <AuthLayout title="Sign In">
            <Box component="form" onSubmit={handleSubmit} noValidate>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="username"
                    label="Username"
                    name="username"
                    autoComplete="username"
                    autoFocus
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type="password"
                    id="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2 }}
                >
                    Sign In
                </Button>
                <Typography variant="body2" align="center">
                    Don't have an account?{' '}
                    <Link component={RouterLink} to="/register" variant="body2">
                        Sign Up
                    </Link>
                </Typography>
            </Box>
        </AuthLayout>
    );
};

export default LoginPage;