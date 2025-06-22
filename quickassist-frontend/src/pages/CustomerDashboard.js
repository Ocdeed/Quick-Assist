// In src/pages/CustomerDashboard.js
import React, { useState } from 'react';
import {
    Container, Box, Modal, Typography, Button, CircularProgress, Alert
} from '@mui/material';
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
    const navigate = useNavigate();

    const handleBookClick = (service) => {
        setSelectedService(service);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setBookingError('');
    };

    const handleConfirmBooking = () => {
        if (!selectedService) return;

        setIsBooking(true);
        setBookingError('');

        // 1. Get user's current location
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    // 2. Make the API request to create a booking
                    const response = await axiosInstance.post('/bookings/', {
                        service_id: selectedService.id,
                        latitude,
                        longitude,
                    });

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
                // Handle location error
                console.error("Geolocation error:", error);
                setBookingError('Could not get your location. Please enable location services.');
                setIsBooking(false);
            }
        );
    };

    return (
        <Box>
            <Header />
            <Container sx={{ mt: 4, mb: 4 }}>
                <ServiceCategoryList onBook={handleBookClick} />
            </Container>

            {/* Booking Confirmation Modal */}
            <Modal open={isModalOpen} onClose={handleCloseModal}>
                <Box sx={modalStyle}>
                    <Typography variant="h6" component="h2">
                        Confirm Booking
                    </Typography>
                    <Typography sx={{ mt: 2 }}>
                        Are you sure you want to book "{selectedService?.name}"? A nearby provider will be assigned to you.
                    </Typography>
                    {bookingError && <Alert severity="error" sx={{ mt: 2 }}>{bookingError}</Alert>}
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button onClick={handleCloseModal} disabled={isBooking}>Cancel</Button>
                        <Button
                            variant="contained"
                            onClick={handleConfirmBooking}
                            disabled={isBooking}
                        >
                            {isBooking ? <CircularProgress size={24} /> : 'Confirm & Find Provider'}
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </Box>
    );
};

export default CustomerDashboard;