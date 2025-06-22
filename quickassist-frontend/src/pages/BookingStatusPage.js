// In src/pages/BookingStatusPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Grid, Box, Typography, Paper, CircularProgress,
    Alert, Button, Chip
} from '@mui/material';
import Header from '../components/Header';
import MapComponent from '../components/Map';
import ChatWindow from '../components/ChatWindow';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../api/axios';
import useWebSocket from 'react-use-websocket';

const BookingStatusPage = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth(); // Assume user object now has {..., user_type: 'CUSTOMER' or 'PROVIDER' }
    
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [providerLocation, setProviderLocation] = useState(null);

    const locationSocketUrl = `ws://127.0.0.1:8000/ws/location/${bookingId}/`;

    const { lastJsonMessage: lastLocationMessage, sendMessage: sendLocationMessage } = useWebSocket(locationSocketUrl, {
        share: true, // Important for sharing connection across components
    });
    
    // --- Data Fetching and State Updates ---
    useEffect(() => {
        const fetchBookingDetails = async () => {
            try {
                const response = await axiosInstance.get(`/bookings/${bookingId}/`);
                setBooking(response.data);
                // Set initial provider location if available
                if (response.data.provider && response.data.provider.provider_profile) {
                    setProviderLocation({
                        latitude: response.data.provider.provider_profile.last_known_latitude,
                        longitude: response.data.provider.provider_profile.last_known_longitude,
                    });
                }
            } catch (err) {
                setError('Failed to load booking details.');
                if (err.response?.status === 404) navigate('/');
            } finally {
                setLoading(false);
            }
        };

        fetchBookingDetails();
    }, [bookingId, navigate]);

    useEffect(() => {
        // Update provider location from WebSocket
        if (lastLocationMessage) {
            setProviderLocation(lastLocationMessage);
        }
    }, [lastLocationMessage]);

    // This simulates the provider's device sending location updates
    useEffect(() => {
        let watchId = null;
        if (user?.user_type === 'PROVIDER' && booking?.status === 'IN_PROGRESS') {
             watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    sendLocationMessage(JSON.stringify({ latitude, longitude }));
                },
                (err) => console.error("Geolocation watch error:", err),
                { enableHighAccuracy: true }
            );
        }
        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };
    }, [user, booking?.status, sendLocationMessage]);

    // --- Actions ---
    const handleUpdateStatus = async (action) => {
        try {
            const response = await axiosInstance.patch(`/bookings/${bookingId}/${action}/`);
            setBooking(response.data); // Update the booking state with the new status
        } catch (err) {
            console.error(`Failed to ${action} job`, err);
            setError(`Could not update job status. Please try again.`);
        }
    };


    // --- Rendering ---
    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error">{error}</Alert>;
    if (!booking) return <Typography>No booking found.</Typography>;

    const customerLocation = { latitude: booking.booking_latitude, longitude: booking.booking_longitude };
    // eslint-disable-next-line no-unused-vars
    const isCustomer = user?.user_type === 'CUSTOMER';
    const isProvider = user?.user_type === 'PROVIDER';
    
    return (
        <Box>
            <Header />
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                {/* --- HEADER --- */}
                <Paper sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h5">Booking Status</Typography>
                        <Chip label={booking.status.replace('_', ' ')} color="primary" sx={{mt: 1}}/>
                    </Box>
                    {/* Provider controls */}
                    {isProvider && (
                        <Box sx={{display: 'flex', gap: 1}}>
                            {booking.status === 'ACCEPTED' && 
                                <Button variant="contained" onClick={() => handleUpdateStatus('start_job')}>Start Job</Button>
                            }
                            {booking.status === 'IN_PROGRESS' && 
                                <Button variant="contained" onClick={() => handleUpdateStatus('complete_job')}>Complete Job</Button>
                            }
                        </Box>
                    )}
                </Paper>

                {/* --- MAIN GRID (MAP & CHAT) --- */}
                <Grid container spacing={3} sx={{ height: '65vh' }}>
                <Grid item xs={12} md={8}>
                {/* We just need to pass the locations. The Map component handles the rest. */}
                {customerLocation && 
                <MapComponent 
                customerLocation={customerLocation} 
                providerLocation={providerLocation} />}
            </Grid>
                    <Grid item xs={12} md={4} sx={{ height: '100%' }}>
                        <ChatWindow bookingId={bookingId} />
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default BookingStatusPage;