// In src/pages/ProviderProfile.js
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
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    List,
    ListItem,
    ListItemText,
    Rating,
    Avatar,
    Divider
} from '@mui/material';
import { 
    Edit as EditIcon, 
    Save as SaveIcon, 
    Cancel as CancelIcon,
    LocationOn as LocationIcon,
    PhotoCamera as PhotoCameraIcon
} from '@mui/icons-material';
import Header from '../components/Header';
import axiosInstance from '../api/axios';

const ProviderProfile = () => {
    const [profileData, setProfileData] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        phone_number: '',
        service_category: '',
        service_id: '',
        service_price: '',
        profile_picture: null,
        business_photos: []
    });
    const [originalProfileData, setOriginalProfileData] = useState({});
    const [categories, setCategories] = useState([]);
    const [services, setServices] = useState([]);
    const [allServices, setAllServices] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [profilePictureFile, setProfilePictureFile] = useState(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState(null);
    
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [updatingLocation, setUpdatingLocation] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        // Filter services based on selected category
        if (profileData.service_category) {
            const categoryServices = allServices.filter(
                service => service.category === parseInt(profileData.service_category)
            );
            setServices(categoryServices);
        } else {
            setServices([]);
        }
    }, [profileData.service_category, allServices]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            
            // Fetch profile data
            const profileResponse = await axiosInstance.get('/users/provider/profile/');
            setProfileData(profileResponse.data);
            setOriginalProfileData(profileResponse.data);
            
            // Fetch categories
            const categoriesResponse = await axiosInstance.get('/categories/');
            setCategories(categoriesResponse.data);
            
            // Fetch all services
            const servicesResponse = await axiosInstance.get('/services/');
            setAllServices(servicesResponse.data);
            
            // Fetch reviews
            const reviewsResponse = await axiosInstance.get('/reviews/provider/');
            setReviews(reviewsResponse.data);
            
        } catch (err) {
            console.error('Failed to fetch profile data:', err);
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

    const handlePhotoChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setProfilePictureFile(file);
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setProfilePicturePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEditClick = () => {
        setIsEditing(true);
        setError('');
        setSuccess('');
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setProfileData(originalProfileData);
        setProfilePictureFile(null);
        setProfilePicturePreview(null);
        setError('');
        setSuccess('');
    };

    const handleSaveProfile = async () => {
        try {
            setSaving(true);
            setError('');
            
            // Create FormData for multipart upload
            const formData = new FormData();
            
            // Add regular fields
            Object.keys(profileData).forEach(key => {
                if (key !== 'profile_picture' && key !== 'business_photos' && profileData[key] !== null) {
                    formData.append(key, profileData[key]);
                }
            });
            
            // Add profile picture if selected
            if (profilePictureFile) {
                formData.append('profile_picture', profilePictureFile);
            }
            
            const response = await axiosInstance.patch('/users/provider/profile/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            setProfileData(response.data);
            setOriginalProfileData(response.data);
            setIsEditing(false);
            setProfilePictureFile(null);
            setProfilePicturePreview(null);
            setSuccess('Profile updated successfully!');
        } catch (err) {
            console.error('Failed to update profile:', err);
            setError(err.response?.data?.detail || 'Failed to update profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateLocation = () => {
        setUpdatingLocation(true);
        setError('');
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                
                try {
                    await axiosInstance.patch('/users/provider/profile/', {
                        latitude,
                        longitude
                    });
                    setSuccess('Location updated successfully!');
                } catch (err) {
                    console.error('Failed to update location:', err);
                    setError('Failed to update location. Please try again.');
                } finally {
                    setUpdatingLocation(false);
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                setError('Could not get your location. Please enable location services and try again.');
                setUpdatingLocation(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            }
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
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
                    Provider Profile
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                    Manage your service offerings and profile information
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
                        {/* Profile Picture */}
                        <Grid item xs={12} sx={{ textAlign: 'center', mb: 2 }}>
                            <Avatar
                                src={profilePicturePreview || profileData.profile_picture}
                                sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                            />
                            {isEditing && (
                                <Box>
                                    <input
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        id="profile-picture-upload"
                                        type="file"
                                        onChange={handlePhotoChange}
                                    />
                                    <label htmlFor="profile-picture-upload">
                                        <Button
                                            variant="outlined"
                                            component="span"
                                            startIcon={<PhotoCameraIcon />}
                                            size="small"
                                        >
                                            Change Photo
                                        </Button>
                                    </label>
                                </Box>
                            )}
                        </Grid>

                        {/* Basic Info */}
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

                        {/* Service Information */}
                        <Grid item xs={12}>
                            <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
                                Service Information
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth disabled={!isEditing}>
                                <InputLabel>Service Category</InputLabel>
                                <Select
                                    value={profileData.service_category}
                                    label="Service Category"
                                    onChange={handleProfileChange('service_category')}
                                >
                                    {categories.map((category) => (
                                        <MenuItem key={category.id} value={category.id}>
                                            {category.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth disabled={!isEditing || !profileData.service_category}>
                                <InputLabel>Service</InputLabel>
                                <Select
                                    value={profileData.service_id}
                                    label="Service"
                                    onChange={handleProfileChange('service_id')}
                                >
                                    {services.map((service) => (
                                        <MenuItem key={service.id} value={service.id}>
                                            {service.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Service Price (KES)"
                                type="number"
                                value={profileData.service_price}
                                onChange={handleProfileChange('service_price')}
                                disabled={!isEditing}
                                variant="outlined"
                                inputProps={{ min: 0 }}
                            />
                        </Grid>
                    </Grid>
                </Paper>

                {/* Location Update Section */}
                <Paper sx={{ p: 4, mb: 4 }}>
                    <Typography variant="h5" component="h2" gutterBottom>
                        Location Services
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Keep your location updated to receive job requests in your area.
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<LocationIcon />}
                        onClick={handleUpdateLocation}
                        disabled={updatingLocation}
                        size="large"
                    >
                        {updatingLocation ? <CircularProgress size={20} /> : 'Update My Location'}
                    </Button>
                </Paper>

                {/* Reviews Section */}
                <Paper sx={{ p: 4 }}>
                    <Typography variant="h5" component="h2" gutterBottom>
                        My Reviews ({reviews.length})
                    </Typography>
                    
                    {reviews.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                            No reviews yet. Complete some jobs to start receiving reviews!
                        </Typography>
                    ) : (
                        <List>
                            {reviews.map((review, index) => (
                                <Box key={review.id}>
                                    <ListItem sx={{ px: 0 }}>
                                        <ListItemText
                                            primary={
                                                <Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                                        <Rating value={review.rating} readOnly size="small" />
                                                        <Typography variant="body2" color="text.secondary">
                                                            {formatDate(review.created_at)}
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                        Customer: {review.customer?.username || 'Anonymous'}
                                                    </Typography>
                                                    {review.comment && (
                                                        <Typography variant="body1">
                                                            "{review.comment}"
                                                        </Typography>
                                                    )}
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                    {index < reviews.length - 1 && <Divider />}
                                </Box>
                            ))}
                        </List>
                    )}
                </Paper>
            </Container>
        </Box>
    );
};

export default ProviderProfile;
