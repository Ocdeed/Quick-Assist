// In src/pages/UserProfile.js
import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Paper,
    TextField,
    Button,
    Box,
    Grid,
    Alert,
    CircularProgress
} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import Header from '../components/Header';
import axiosInstance from '../api/axios';

const UserProfile = () => {
    const [profileData, setProfileData] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        phone_number: ''
    });
    const [originalProfileData, setOriginalProfileData] = useState({});
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/users/me/');
            setProfileData(response.data);
            setOriginalProfileData(response.data);
        } catch (err) {
            console.error('Failed to fetch user profile:', err);
            setError('Failed to load profile data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleProfileChange = (field) => (event) => {
        setProfileData(prev => ({
            ...prev,
            [field]: event.target.value
        }));
    };

    const handlePasswordChange = (field) => (event) => {
        setPasswordData(prev => ({
            ...prev,
            [field]: event.target.value
        }));
    };

    const handleEditClick = () => {
        setIsEditing(true);
        setError('');
        setSuccess('');
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setProfileData(originalProfileData);
        setError('');
        setSuccess('');
    };

    const handleSaveProfile = async () => {
        try {
            setSaving(true);
            setError('');
            
            const response = await axiosInstance.patch('/users/me/', profileData);
            setProfileData(response.data);
            setOriginalProfileData(response.data);
            setIsEditing(false);
            setSuccess('Profile updated successfully!');
        } catch (err) {
            console.error('Failed to update profile:', err);
            setError(err.response?.data?.detail || 'Failed to update profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        // Validate password fields
        if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
            setPasswordError('All password fields are required.');
            return;
        }

        if (passwordData.new_password !== passwordData.confirm_password) {
            setPasswordError('New passwords do not match.');
            return;
        }

        if (passwordData.new_password.length < 8) {
            setPasswordError('New password must be at least 8 characters long.');
            return;
        }

        try {
            setChangingPassword(true);
            setPasswordError('');
            
            await axiosInstance.patch('/users/change-password/', {
                current_password: passwordData.current_password,
                new_password: passwordData.new_password
            });
            
            setPasswordData({
                current_password: '',
                new_password: '',
                confirm_password: ''
            });
            setPasswordSuccess('Password changed successfully!');
        } catch (err) {
            console.error('Failed to change password:', err);
            setPasswordError(err.response?.data?.detail || 'Failed to change password. Please try again.');
        } finally {
            setChangingPassword(false);
        }
    };

    if (loading) {
        return (
            <Box>
                <Header />
                <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                </Container>
            </Box>
        );
    }

    return (
        <Box>
            <Header />
            <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h3" component="h1" gutterBottom>
                    User Profile
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                    Manage your account information and settings
                </Typography>

                {/* Profile Information Section */}
                <Paper sx={{ p: 4, mb: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h5" component="h2">
                            Profile Information
                        </Typography>
                        {!isEditing ? (
                            <Button
                                variant="outlined"
                                startIcon={<EditIcon />}
                                onClick={handleEditClick}
                            >
                                Edit Profile
                            </Button>
                        ) : (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<CancelIcon />}
                                    onClick={handleCancelEdit}
                                    disabled={saving}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<SaveIcon />}
                                    onClick={handleSaveProfile}
                                    disabled={saving}
                                >
                                    {saving ? <CircularProgress size={20} /> : 'Save Changes'}
                                </Button>
                            </Box>
                        )}
                    </Box>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Username"
                                value={profileData.username}
                                onChange={handleProfileChange('username')}
                                disabled={!isEditing}
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Email"
                                type="email"
                                value={profileData.email}
                                onChange={handleProfileChange('email')}
                                disabled={!isEditing}
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="First Name"
                                value={profileData.first_name}
                                onChange={handleProfileChange('first_name')}
                                disabled={!isEditing}
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Last Name"
                                value={profileData.last_name}
                                onChange={handleProfileChange('last_name')}
                                disabled={!isEditing}
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Phone Number"
                                value={profileData.phone_number}
                                onChange={handleProfileChange('phone_number')}
                                disabled={!isEditing}
                                variant="outlined"
                            />
                        </Grid>
                    </Grid>
                </Paper>

                {/* Change Password Section */}
                <Paper sx={{ p: 4 }}>
                    <Typography variant="h5" component="h2" gutterBottom>
                        Change Password
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Ensure your account is using a long, random password to stay secure.
                    </Typography>

                    {passwordError && <Alert severity="error" sx={{ mb: 2 }}>{passwordError}</Alert>}
                    {passwordSuccess && <Alert severity="success" sx={{ mb: 2 }}>{passwordSuccess}</Alert>}

                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Current Password"
                                type="password"
                                value={passwordData.current_password}
                                onChange={handlePasswordChange('current_password')}
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="New Password"
                                type="password"
                                value={passwordData.new_password}
                                onChange={handlePasswordChange('new_password')}
                                variant="outlined"
                                helperText="Must be at least 8 characters long"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Confirm New Password"
                                type="password"
                                value={passwordData.confirm_password}
                                onChange={handlePasswordChange('confirm_password')}
                                variant="outlined"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                variant="contained"
                                onClick={handleChangePassword}
                                disabled={changingPassword}
                                sx={{ mt: 2 }}
                            >
                                {changingPassword ? <CircularProgress size={20} /> : 'Change Password'}
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>
            </Container>
        </Box>
    );
};

export default UserProfile;
