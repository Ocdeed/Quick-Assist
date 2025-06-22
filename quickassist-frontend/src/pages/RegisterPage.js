// In src/pages/RegisterPage.js
import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Box, Button, TextField, Typography, Alert, Link,
    FormControl, FormLabel, RadioGroup, FormControlLabel, Radio
} from '@mui/material';
import AuthLayout from '../components/AuthLayout';
import axiosInstance from '../api/axios';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        phone_number: '',
        first_name: '',
        last_name: '',
        user_type: 'CUSTOMER',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            await axiosInstance.post('/auth/register/', formData);
            setSuccess('Registration successful! You can now log in.');
            setTimeout(() => navigate('/login'), 2000); // Redirect after 2 seconds
        } catch (err) {
            if (err.response && err.response.data) {
                // Concatenate errors from the backend for display
                const errorData = err.response.data;
                const errorMessages = Object.keys(errorData)
                    .map(key => `${key}: ${errorData[key]}`)
                    .join(' ');
                setError(errorMessages || 'Failed to register.');
            } else {
                setError('An unknown error occurred during registration.');
            }
        }
    };

    return (
        <AuthLayout title="Create Account">
            <Box component="form" onSubmit={handleSubmit} noValidate>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
                
                {/* Form fields */}
                <TextField name="username" label="Username" onChange={handleChange} fullWidth required margin="normal" />
                <TextField name="email" label="Email Address" type="email" onChange={handleChange} fullWidth required margin="normal" />
                <TextField name="password" label="Password" type="password" onChange={handleChange} fullWidth required margin="normal" />
                <TextField name="phone_number" label="Phone Number" onChange={handleChange} fullWidth margin="normal" />
                <TextField name="first_name" label="First Name" onChange={handleChange} fullWidth required margin="normal" />
                <TextField name="last_name" label="Last Name" onChange={handleChange} fullWidth required margin="normal" />

                <FormControl component="fieldset" margin="normal">
                    <FormLabel component="legend">I am a...</FormLabel>
                    <RadioGroup
                        row
                        aria-label="user type"
                        name="user_type"
                        value={formData.user_type}
                        onChange={handleChange}
                    >
                        <FormControlLabel value="CUSTOMER" control={<Radio />} label="Customer" />
                        <FormControlLabel value="PROVIDER" control={<Radio />} label="Service Provider" />
                    </RadioGroup>
                </FormControl>

                <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
                    Sign Up
                </Button>
                <Typography variant="body2" align="center">
                    Already have an account?{' '}
                    <Link component={RouterLink} to="/login" variant="body2">
                        Sign In
                    </Link>
                </Typography>
            </Box>
        </AuthLayout>
    );
};

export default RegisterPage;