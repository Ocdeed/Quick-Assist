// In src/pages/BookingHistory.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    CircularProgress,
    Alert,
    Box,
    TablePagination
} from '@mui/material';
import Header from '../components/Header';
import axiosInstance from '../api/axios';

const BookingHistory = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const navigate = useNavigate();

    useEffect(() => {
        fetchBookingHistory();
    }, []);

    const fetchBookingHistory = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/bookings/history/');
            setBookings(response.data);
        } catch (err) {
            console.error('Failed to fetch booking history:', err);
            setError('Failed to load booking history. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const statusColors = {
            'COMPLETED': 'success',
            'IN_PROGRESS': 'primary',
            'ACCEPTED': 'info',
            'PENDING': 'warning',
            'CANCELLED': 'error'
        };
        return statusColors[status] || 'default';
    };

    const formatCurrency = (amount) => {
        if (!amount) return 'N/A';
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleRowClick = (bookingId) => {
        navigate(`/booking/${bookingId}`);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    if (loading) {
        return (
            <Box>
                <Header />
                <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                </Container>
            </Box>
        );
    }

    if (error) {
        return (
            <Box>
                <Header />
                <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                    <Alert severity="error">{error}</Alert>
                </Container>
            </Box>
        );
    }

    const paginatedBookings = bookings.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    return (
        <Box>
            <Header />
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h3" component="h1" gutterBottom>
                    Booking History
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                    View all your past and current bookings
                </Typography>

                {bookings.length === 0 ? (
                    <Paper sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary">
                            You haven't made any bookings yet.
                        </Typography>
                    </Paper>
                ) : (
                    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                        <TableContainer>
                            <Table stickyHeader aria-label="booking history table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Booking ID</TableCell>
                                        <TableCell>Service</TableCell>
                                        <TableCell>Provider</TableCell>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell align="right">Amount</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedBookings.map((booking) => (
                                        <TableRow 
                                            key={booking.id} 
                                            hover 
                                            onClick={() => handleRowClick(booking.id)}
                                            sx={{ 
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    backgroundColor: 'action.hover'
                                                }
                                            }}
                                        >
                                            <TableCell component="th" scope="row">
                                                #{booking.id}
                                            </TableCell>
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {booking.service?.name || 'N/A'}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {booking.service?.category?.name || ''}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                {booking.provider?.username || 'Not assigned'}
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(booking.created_at)}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={booking.status?.replace('_', ' ') || 'Unknown'}
                                                    color={getStatusColor(booking.status)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                {formatCurrency(booking.amount)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25]}
                            component="div"
                            count={bookings.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    </Paper>
                )}
            </Container>
        </Box>
    );
};

export default BookingHistory;
