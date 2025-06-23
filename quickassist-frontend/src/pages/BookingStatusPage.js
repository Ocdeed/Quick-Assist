// In src/pages/BookingStatusPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Grid, Box, Typography, Paper, CircularProgress,
    Alert, Button, Chip, Avatar, Rating, Card, CardContent, TextField
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
    
    // Payment states
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [cashPaymentMessage, setCashPaymentMessage] = useState('');
    
    // Rating states
    const [ratingValue, setRatingValue] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewLoading, setReviewLoading] = useState(false);

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
    }, [user, booking?.status, sendLocationMessage]);    // --- Actions ---
    const handleUpdateStatus = async (action) => {
        try {
            const response = await axiosInstance.patch(`/bookings/${bookingId}/${action}/`);
            setBooking(response.data); // Update the booking state with the new status
        } catch (err) {
            console.error(`Failed to ${action} job`, err);
            setError(`Could not update job status. Please try again.`);
        }
    };

    // Payment handlers
    const handleMobilePayment = async () => {
        setPaymentLoading(true);
        try {
            console.log('Initiating mobile payment for booking:', bookingId);
            const response = await axiosInstance.post(`/bookings/${booking.id}/pay/`);
            console.log('Mobile payment response:', response.data);
            // Refresh booking data to get updated payment status
            const updatedBooking = await axiosInstance.get(`/bookings/${bookingId}/`);
            setBooking(updatedBooking.data);
        } catch (err) {
            console.error('Mobile payment failed:', err);
            setError('Mobile payment failed. Please try again.');
        } finally {
            setPaymentLoading(false);
        }
    };

    const handleCashPayment = () => {
        setCashPaymentMessage('Waiting for provider to confirm cash payment has been received.');
    };

    // Rating handler
    const handleSubmitReview = async () => {
        setReviewLoading(true);
        try {
            console.log('Submitting review for booking:', bookingId);
            const response = await axiosInstance.post(`/bookings/${booking.id}/rate/`, {
                rating: ratingValue,
                comment: reviewComment
            });
            console.log('Review submission response:', response.data);
            // Refresh booking data to get updated rating status
            const updatedBooking = await axiosInstance.get(`/bookings/${bookingId}/`);
            setBooking(updatedBooking.data);
            // Reset form
            setRatingValue(0);
            setReviewComment('');
        } catch (err) {
            console.error('Review submission failed:', err);
            setError('Failed to submit review. Please try again.');
        } finally {
            setReviewLoading(false);
        }
    };


    // --- Rendering ---
    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error">{error}</Alert>;
    if (!booking) return <Typography>No booking found.</Typography>;    const customerLocation = { latitude: booking?.booking_latitude, longitude: booking?.booking_longitude };
    const isCustomer = user?.user_type === 'CUSTOMER';
    const isProvider = user?.user_type === 'PROVIDER';
    
    return (
        <Box>
            <Header />
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                {/* --- HEADER --- */}                <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h5">Booking Status</Typography>
                        <Chip label={booking?.status?.replace('_', ' ') || 'Loading...'} color="primary" sx={{mt: 1}}/>
                    </Box>
                    {/* Provider controls */}
                    {isProvider && (
                        <Box sx={{display: 'flex', gap: 1}}>
                            {booking?.status === 'ACCEPTED' && 
                                <Button variant="contained" onClick={() => handleUpdateStatus('start_job')}>Start Job</Button>
                            }
                            {booking?.status === 'IN_PROGRESS' && 
                                <Button variant="contained" onClick={() => handleUpdateStatus('complete_job')}>Complete Job</Button>
                            }
                        </Box>
                    )}
                </Paper>

                {/* --- Details Section --- */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={isProvider ? 12 : 8}>                        <Paper sx={{ p: 2, height: '100%' }}>
                            <Typography variant="h6">Job Details</Typography>
                            <Typography><b>Service:</b> {booking?.service?.name || 'Loading...'}</Typography>
                            <Typography><b>Address:</b> {booking?.booking_address || 'Address not available'}</Typography>
                            {isProvider && <Typography><b>Customer:</b> {booking?.customer?.username || 'Unknown'}</Typography>}
                        </Paper>
                    </Grid>                    {isCustomer && booking?.provider && (
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                                <Typography variant="h6">Your Provider</Typography>
                                <Avatar sx={{ width: 80, height: 80, margin: '16px auto' }} src={booking?.provider?.provider_profile?.profile_picture_url} />
                                <Typography variant="body1" fontWeight="bold">{booking?.provider?.username || 'Unknown Provider'}</Typography>
                                <Rating value={booking?.provider?.provider_profile?.average_rating || 0} readOnly />
                            </Paper>
                        </Grid>
                    )}
                </Grid>

                {/* --- PAYMENT SECTION (F5) --- */}
                {booking?.status === 'COMPLETED' && booking?.is_paid === false && (
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        <Grid item xs={12}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Complete Your Payment
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                                        <Button 
                                            variant="contained" 
                                            onClick={handleMobilePayment}
                                            disabled={paymentLoading}
                                        >
                                            {paymentLoading ? 'Processing...' : 'Pay with Mobile Money'}
                                        </Button>
                                        <Button 
                                            variant="outlined" 
                                            onClick={handleCashPayment}
                                        >
                                            Pay with Cash
                                        </Button>
                                    </Box>
                                    {cashPaymentMessage && (
                                        <Alert severity="info" sx={{ mt: 2 }}>
                                            {cashPaymentMessage}
                                        </Alert>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                )}

                {/* --- RATINGS SECTION (F6) --- */}
                {booking?.status === 'COMPLETED' && booking?.is_paid === true && booking?.rating === null && (
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        <Grid item xs={12}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Rate Your Experience
                                    </Typography>
                                    <Box sx={{ mt: 2 }}>
                                        <Typography component="legend" sx={{ mb: 1 }}>
                                            How would you rate this service?
                                        </Typography>
                                        <Rating
                                            name="service-rating"
                                            value={ratingValue}
                                            onChange={(event, newValue) => {
                                                setRatingValue(newValue);
                                            }}
                                            size="large"
                                            sx={{ mb: 2 }}
                                        />
                                        <TextField
                                            label="Comments (optional)"
                                            multiline
                                            rows={3}
                                            fullWidth
                                            value={reviewComment}
                                            onChange={(e) => setReviewComment(e.target.value)}
                                            sx={{ mb: 2 }}
                                        />
                                        <Button 
                                            variant="contained"
                                            onClick={handleSubmitReview}
                                            disabled={reviewLoading || ratingValue === 0}
                                        >
                                            {reviewLoading ? 'Submitting...' : 'Submit Review'}
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                )}

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
                        <ChatWindow bookingId={bookingId} currentUser={user} />
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default BookingStatusPage;