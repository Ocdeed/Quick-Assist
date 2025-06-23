// In src/pages/ProviderDashboard.js
import React, { useState, useEffect } from 'react';
import { 
    Container, 
    Typography, 
    FormControlLabel, 
    Switch, 
    Box, 
    Alert,
    CircularProgress,    Paper,
    List,
    ListItem,
    ListItemText,
    Button,
    Chip,
    Divider
} from '@mui/material';
import Header from '../components/Header';
import axiosInstance from '../api/axios';

const ProviderDashboard = () => {
    const [isOnDuty, setIsOnDuty] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dutyToggleLoading, setDutyToggleLoading] = useState(false);
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [activeJobs, setActiveJobs] = useState([]);
    const [jobActionLoading, setJobActionLoading] = useState({});    // Fetch user profile and jobs data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch user profile to get on-duty status
                const profileResponse = await axiosInstance.get('/users/me/');
                const onDutyStatus = profileResponse.data.provider_profile?.is_on_duty || false;
                setIsOnDuty(onDutyStatus);
                
                // Fetch jobs for the provider
                await fetchJobs();
                
            } catch (err) {
                console.error('Failed to fetch provider data:', err);
                setError('Failed to load provider information. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const fetchJobs = async () => {
        try {
            const response = await axiosInstance.get('/bookings/provider/');
            const jobs = response.data;
            
            // Separate jobs by status
            const pending = jobs.filter(job => job.status === 'PENDING');
            const active = jobs.filter(job => ['ACCEPTED', 'IN_PROGRESS'].includes(job.status));
            
            setIncomingRequests(pending);
            setActiveJobs(active);
        } catch (err) {
            console.error('Failed to fetch jobs:', err);
        }
    };

    // Handle on-duty toggle
    const handleToggleDuty = async (event) => {
        const newDutyStatus = event.target.checked;
        
        // Optimistically update the UI
        setIsOnDuty(newDutyStatus);
        setDutyToggleLoading(true);
        setError('');

        try {
            // Make API call to update on-duty status
            await axiosInstance.patch('/users/provider/profile/', {
                is_on_duty: newDutyStatus
            });
        } catch (err) {
            // Revert the toggle on error
            console.error('Failed to update duty status:', err);
            setIsOnDuty(!newDutyStatus);
            setError('Failed to update duty status. Please try again.');        } finally {
            setDutyToggleLoading(false);
        }
    };

    // Handle job accept/decline actions
    const handleJobAction = async (bookingId, action) => {
        setJobActionLoading(prev => ({ ...prev, [bookingId]: action }));
        
        try {
            await axiosInstance.post(`/bookings/${bookingId}/${action}/`);
            // Refresh jobs list after successful action
            await fetchJobs();
        } catch (err) {
            console.error(`Failed to ${action} job:`, err);
            setError(`Failed to ${action} job. Please try again.`);
        } finally {
            setJobActionLoading(prev => ({ ...prev, [bookingId]: null }));
        }
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

    const formatCurrency = (amount) => {
        if (!amount) return 'N/A';
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES'
        }).format(amount);
    };

    if (loading) {
        return (
            <Box>
                <Header />
                <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress />
                </Container>
            </Box>
        );
    }

    return (
        <Box>
            <Header />
            <Container sx={{ mt: 4 }}>
                <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
                    Provider Dashboard
                </Typography>

                {/* Error Alert */}
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                {/* On-Duty Toggle */}
                <Box sx={{ mb: 4, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={isOnDuty}
                                onChange={handleToggleDuty}
                                disabled={dutyToggleLoading}
                                color="primary"
                            />
                        }
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="h6">
                                    {isOnDuty ? 'On Duty' : 'Off Duty'}
                                </Typography>
                                {dutyToggleLoading && <CircularProgress size={20} />}
                            </Box>
                        }
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                        {isOnDuty 
                            ? 'You are currently available to receive job requests' 
                            : 'You will not receive new job requests while off duty'
                        }
                    </Typography>
                </Box>                {/* Future: Jobs list will go here */}
                <Typography variant="h6" color="text.secondary">
                    Job list coming soon...
                </Typography>

                {/* Incoming Job Requests */}
                {incomingRequests.length > 0 && (
                    <Paper sx={{ mb: 4 }}>
                        <Box sx={{ p: 3 }}>
                            <Typography variant="h5" gutterBottom>
                                Incoming Requests ({incomingRequests.length})
                            </Typography>
                            <List>
                                {incomingRequests.map((request, index) => (
                                    <Box key={request.id}>
                                        <ListItem sx={{ px: 0 }}>
                                            <ListItemText
                                                primary={
                                                    <Box>
                                                        <Typography variant="h6">
                                                            {request.service?.name || 'Service Request'}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Customer: {request.customer?.username || 'N/A'}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Address: {request.booking_address || 'Address not available'}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Requested: {formatDate(request.created_at)}
                                                        </Typography>
                                                        {request.amount && (
                                                            <Typography variant="body2" color="text.secondary">
                                                                Amount: {formatCurrency(request.amount)}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                }
                                            />
                                            <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                                                <Button
                                                    variant="contained"
                                                    color="success"
                                                    onClick={() => handleJobAction(request.id, 'accept')}
                                                    disabled={jobActionLoading[request.id] === 'accept'}
                                                    size="small"
                                                >
                                                    {jobActionLoading[request.id] === 'accept' ? (
                                                        <CircularProgress size={20} />
                                                    ) : (
                                                        'Accept'
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    onClick={() => handleJobAction(request.id, 'decline')}
                                                    disabled={jobActionLoading[request.id] === 'decline'}
                                                    size="small"
                                                >
                                                    {jobActionLoading[request.id] === 'decline' ? (
                                                        <CircularProgress size={20} />
                                                    ) : (
                                                        'Decline'
                                                    )}
                                                </Button>
                                            </Box>
                                        </ListItem>
                                        {index < incomingRequests.length - 1 && <Divider />}
                                    </Box>
                                ))}
                            </List>
                        </Box>
                    </Paper>
                )}

                {/* Active Jobs */}
                {activeJobs.length > 0 && (
                    <Paper sx={{ mb: 4 }}>
                        <Box sx={{ p: 3 }}>
                            <Typography variant="h5" gutterBottom>
                                Active Jobs ({activeJobs.length})
                            </Typography>
                            <List>
                                {activeJobs.map((job, index) => (
                                    <Box key={job.id}>
                                        <ListItem sx={{ px: 0 }}>
                                            <ListItemText
                                                primary={
                                                    <Box>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                            <Typography variant="h6">
                                                                {job.service?.name || 'Active Job'}
                                                            </Typography>
                                                            <Chip 
                                                                label={job.status.replace('_', ' ')} 
                                                                color={job.status === 'ACCEPTED' ? 'info' : 'primary'}
                                                                size="small"
                                                            />
                                                        </Box>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Customer: {job.customer?.username || 'N/A'}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Address: {job.booking_address || 'Address not available'}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Started: {formatDate(job.created_at)}
                                                        </Typography>
                                                        {job.amount && (
                                                            <Typography variant="body2" color="text.secondary">
                                                                Amount: {formatCurrency(job.amount)}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                }
                                            />
                                            <Box sx={{ ml: 2 }}>
                                                <Button
                                                    variant="contained"
                                                    onClick={() => window.open(`/booking/${job.id}`, '_blank')}
                                                    size="small"
                                                >
                                                    View Details
                                                </Button>
                                            </Box>
                                        </ListItem>
                                        {index < activeJobs.length - 1 && <Divider />}
                                    </Box>
                                ))}
                            </List>
                        </Box>
                    </Paper>
                )}

                {/* No Jobs Message */}
                {incomingRequests.length === 0 && activeJobs.length === 0 && !loading && (
                    <Paper sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary">
                            {isOnDuty ? 'No job requests at the moment. Stay tuned!' : 'Turn on duty to start receiving job requests.'}
                        </Typography>
                    </Paper>
                )}
            </Container>
        </Box>
    );
};

export default ProviderDashboard;
