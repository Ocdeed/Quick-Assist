// In src/pages/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Grid,
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
    Box
} from '@mui/material';
import {
    People as PeopleIcon,
    Business as BusinessIcon,
    CheckCircle as CheckCircleIcon,
    AttachMoney as AttachMoneyIcon
} from '@mui/icons-material';
import AdminLayout from '../components/AdminLayout';
import StatCard from '../components/StatCard';
import axiosInstance from '../api/axios';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [recentBookings, setRecentBookings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            
            // Fetch stats data
            const statsResponse = await axiosInstance.get('/admin/stats/');
            setStats(statsResponse.data);

            // Fetch recent bookings data
            const bookingsResponse = await axiosInstance.get('/admin/recent-bookings/');
            setRecentBookings(bookingsResponse.data);

        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
            setError('Failed to load dashboard data. Please try again.');
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
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <AdminLayout>
                <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                </Container>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                    <Alert severity="error">{error}</Alert>
                </Container>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h3" component="h1" gutterBottom>
                    Admin Dashboard
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                    Welcome to the Quick Assist Administration Panel
                </Typography>

                {/* Stats Cards */}
                {stats && (
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Total Users"
                                value={stats.total_users}
                                icon={<PeopleIcon sx={{ fontSize: 48 }} />}
                                color="primary"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Total Providers"
                                value={stats.total_providers}
                                icon={<BusinessIcon sx={{ fontSize: 48 }} />}
                                color="secondary"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Completed This Month"
                                value={stats.completed_bookings_month}
                                icon={<CheckCircleIcon sx={{ fontSize: 48 }} />}
                                color="success"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard
                                title="Revenue This Month"
                                value={formatCurrency(stats.total_revenue_month)}
                                icon={<AttachMoneyIcon sx={{ fontSize: 48 }} />}
                                color="warning"
                            />
                        </Grid>
                    </Grid>
                )}

                {/* Recent Bookings Table */}
                {recentBookings && (
                    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                        <Typography variant="h5" component="h2" sx={{ p: 2, pb: 0 }}>
                            Recent Bookings
                        </Typography>
                        <TableContainer sx={{ maxHeight: 440 }}>
                            <Table stickyHeader aria-label="recent bookings table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Booking ID</TableCell>
                                        <TableCell>Customer</TableCell>
                                        <TableCell>Provider</TableCell>
                                        <TableCell>Service</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell align="right">Amount</TableCell>
                                        <TableCell>Date</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {recentBookings.map((booking) => (
                                        <TableRow key={booking.id} hover>
                                            <TableCell component="th" scope="row">
                                                #{booking.id}
                                            </TableCell>
                                            <TableCell>
                                                {booking.customer?.username || 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                {booking.provider?.username || 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                {booking.service?.name || 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={booking.status?.replace('_', ' ') || 'Unknown'}
                                                    color={getStatusColor(booking.status)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                {booking.amount ? formatCurrency(booking.amount) : 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                {booking.created_at ? formatDate(booking.created_at) : 'N/A'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                )}
            </Container>
        </AdminLayout>
    );
};

export default AdminDashboard;
