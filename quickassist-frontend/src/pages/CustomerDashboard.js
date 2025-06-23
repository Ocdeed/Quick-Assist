// In src/pages/CustomerDashboard.js
import React, { useState, useEffect } from 'react';
import {
    Container, Box, Modal, Typography, Button, CircularProgress, Alert,
    TextField, Select, MenuItem, FormControl, InputLabel, Switch,
    FormControlLabel, Grid
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Header from '../components/Header';
import ServiceCategoryList from '../components/ServiceCategoryList';
import axiosInstance from '../api/axios';
import { useNavigate } from 'react-router-dom';

// Style for the modal
const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const CustomerDashboard = () => {
    const [selectedService, setSelectedService] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBooking, setIsBooking] = useState(false);
    const [bookingError, setBookingError] = useState('');
    
    // Search and filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [categories, setCategories] = useState([]);
    
    // Schedule for later states
    const [scheduleForLater, setScheduleForLater] = useState(false);
    const [scheduledDateTime, setScheduledDateTime] = useState(null);
    
    const navigate = useNavigate();

    // Fetch categories on component mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axiosInstance.get('/categories/');
                setCategories(response.data);
            } catch (err) {
                console.error('Failed to fetch categories:', err);
            }
        };
        fetchCategories();
    }, []);

    const handleBookClick = (service) => {
        setSelectedService(service);
        setIsModalOpen(true);
    };    const handleCloseModal = () => {
        setIsModalOpen(false);
        setBookingError('');
        setScheduleForLater(false);
        setScheduledDateTime(null);
    };const handleConfirmBooking = () => {
        if (!selectedService) return;

        setIsBooking(true);
        setBookingError('');

        try {
            // 1. Get user's current location
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;                    try {
                        // 2. Make the API request to create a booking
                        const bookingData = {
                            service_id: selectedService.id,
                            latitude,
                            longitude,
                        };
                        
                        // Add scheduled time if "Schedule for Later" is enabled
                        if (scheduleForLater && scheduledDateTime) {
                            bookingData.scheduled_time = scheduledDateTime.toISOString();
                        }
                        
                        const response = await axiosInstance.post('/bookings/', bookingData);

                        // 3. On success, redirect to the booking status page
                        navigate(`/booking/${response.data.id}`);

                    } catch (err) {
                        const errorMsg = err.response?.data?.detail || 'Could not find a provider. Please try again later.';
                        setBookingError(errorMsg);
                    } finally {
                        setIsBooking(false);
                    }
                },
                (error) => {
                    // Handle geolocation API errors (denied, unavailable, timeout, etc.)
                    console.error("Geolocation error:", error);
                    let errorMsg = 'Could not get your location. ';
                    
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMsg += 'Please enable location services and try again.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMsg += 'Location information is unavailable.';
                            break;
                        case error.TIMEOUT:
                            errorMsg += 'Location request timed out. Please try again.';
                            break;
                        default:
                            errorMsg += 'An unknown error occurred.';
                            break;
                    }
                    
                    setBookingError(errorMsg);
                    setIsBooking(false);
                },
                {
                    // Geolocation options
                    enableHighAccuracy: true,
                    timeout: 10000, // 10 second timeout
                    maximumAge: 300000 // Accept cached position up to 5 minutes old
                }
            );
        } catch (error) {
            // Handle any unexpected errors with the geolocation API call itself
            console.error("Error accessing geolocation API:", error);
            setBookingError('Location services are not available on this device. Please try again later.');
            setIsBooking(false);
        }
    };    return (
        <Box>
            <Header />
            <Container sx={{ mt: 4, mb: 4 }}>
                {/* Search and Filter Section */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Find Services
                    </Typography>
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Search services..."
                                variant="outlined"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Enter service name"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel id="category-select-label">Category</InputLabel>
                                <Select
                                    labelId="category-select-label"
                                    value={selectedCategory}
                                    label="Category"
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                >
                                    <MenuItem value="">All Categories</MenuItem>
                                    {categories.map((category) => (
                                        <MenuItem key={category.id} value={category.id}>
                                            {category.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Box>

                <ServiceCategoryList 
                    onBook={handleBookClick}
                    searchTerm={searchTerm}
                    selectedCategory={selectedCategory}
                />
            </Container>

            {/* Enhanced Booking Confirmation Modal */}
            <Modal open={isModalOpen} onClose={handleCloseModal}>
                <Box sx={modalStyle}>
                    <Typography variant="h6" component="h2" gutterBottom>
                        Confirm Booking
                    </Typography>
                    <Typography sx={{ mt: 2, mb: 3 }}>
                        Are you sure you want to book "{selectedService?.name}"?
                    </Typography>
                    
                    {/* Schedule for Later Option */}
                    <FormControlLabel
                        control={
                            <Switch
                                checked={scheduleForLater}
                                onChange={(e) => setScheduleForLater(e.target.checked)}
                            />
                        }
                        label="Schedule for Later"
                        sx={{ mb: 2 }}
                    />
                      {/* Date/Time Picker */}
                    {scheduleForLater && (
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DateTimePicker
                                label="Select Date & Time"
                                value={scheduledDateTime}
                                onChange={setScheduledDateTime}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        sx: { mb: 2 }
                                    }
                                }}
                                minDateTime={new Date()}
                            />
                        </LocalizationProvider>
                    )}
                    
                    {bookingError && <Alert severity="error" sx={{ mt: 2 }}>{bookingError}</Alert>}
                    
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button onClick={handleCloseModal} disabled={isBooking}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleConfirmBooking}
                            disabled={isBooking || (scheduleForLater && !scheduledDateTime)}
                        >
                            {isBooking ? <CircularProgress size={24} /> : 
                             scheduleForLater ? 'Schedule Booking' : 'Book Now'}
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </Box>
    );
};

export default CustomerDashboard;