// In src/pages/admin/ManageUsers.js
import React, { useState, useEffect, useCallback } from 'react';
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
    TablePagination,
    TableSortLabel,
    Chip,
    CircularProgress,
    Alert,
    Box,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    Modal
} from '@mui/material';
import {
    Person as PersonIcon,
    Business as BusinessIcon,
    VerifiedUser as VerifyIcon
} from '@mui/icons-material';
import AdminLayout from '../../components/AdminLayout';
import axiosInstance from '../../api/axios';

const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Table state
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [orderBy, setOrderBy] = useState('date_joined');
    const [order, setOrder] = useState('desc');
    
    // Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [userTypeFilter, setUserTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    
    // Action loading state
    const [actionLoading, setActionLoading] = useState(false);
    
    // User detail modal state
    const [userDetailModal, setUserDetailModal] = useState({
        open: false,
        user: null
    });
    
    // Confirmation dialog state
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: '',
        message: '',
        action: null,
        user: null
    });

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/admin/users/');
            setUsers(response.data);
        } catch (err) {
            console.error('Failed to fetch users:', err);
            setError('Failed to load users. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const filterUsers = useCallback(() => {
        let filtered = [...users];

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(user =>
                user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply user type filter
        if (userTypeFilter) {
            filtered = filtered.filter(user => user.user_type === userTypeFilter);
        }

        // Apply status filter
        if (statusFilter) {
            if (statusFilter === 'ACTIVE') {
                filtered = filtered.filter(user => user.is_active === true);
            } else if (statusFilter === 'SUSPENDED') {
                filtered = filtered.filter(user => user.is_active === false);
            } else if (statusFilter === 'PENDING' && statusFilter === 'PROVIDER') {
                filtered = filtered.filter(user => 
                    user.user_type === 'PROVIDER' && 
                    user.provider_profile && 
                    !user.provider_profile.is_verified
                );
            }
        }

        setFilteredUsers(filtered);
    }, [users, searchTerm, userTypeFilter, statusFilter]);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        filterUsers();
    }, [filterUsers]);

    const handleSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Direct action handlers for the new button-based interface
    const handleActivate = (user) => {
        handleConfirmAction(
            'activate',
            user,
            'Activate User',
            `Are you sure you want to activate user ${getFullName(user)}?`
        );
    };

    const handleSuspend = (user) => {
        handleConfirmAction(
            'suspend',
            user,
            'Suspend User',
            `Are you sure you want to suspend user ${getFullName(user)}? This action will prevent them from using the platform.`
        );
    };

    const handleVerify = (user) => {
        handleConfirmAction(
            'verify-provider',
            user,
            'Verify Provider',
            `Are you sure you want to verify provider ${getFullName(user)}? This will mark them as a trusted service provider.`
        );
    };

    const handleConfirmAction = (action, user, title, message) => {
        setConfirmDialog({
            open: true,
            title,
            message,
            action,
            user
        });
    };

    const handleCloseConfirmDialog = () => {
        setConfirmDialog({
            open: false,
            title: '',
            message: '',
            action: null,
            user: null
        });
    };

    const executeAction = async () => {
        const { action, user } = confirmDialog;
        
        try {
            setActionLoading(true);
            const response = await axiosInstance.post(`/admin/users/${user.id}/${action}/`);
            
            // Update local state with the updated user data
            setUsers(prevUsers => 
                prevUsers.map(u => 
                    u.id === user.id ? response.data : u
                )
            );
            
            setSuccess(`User ${action.replace('_', ' ')} successful!`);
        } catch (err) {
            console.error(`Failed to ${action} user:`, err);
            setError(`Failed to ${action.replace('_', ' ')} user. Please try again.`);
        } finally {
            setActionLoading(false);
            handleCloseConfirmDialog();
        }
    };

    const getUserStatus = (user) => {
        if (!user.is_active) {
            return 'SUSPENDED';
        }
        if (user.user_type === 'PROVIDER' && user.provider_profile && !user.provider_profile.is_verified) {
            return 'PENDING';
        }
        return 'ACTIVE';
    };

    const getStatusColor = (user) => {
        const status = getUserStatus(user);
        const statusColors = {
            'ACTIVE': 'success',
            'SUSPENDED': 'error',
            'PENDING': 'warning'
        };
        return statusColors[status] || 'default';
    };

    const handleRowClick = (user) => {
        setUserDetailModal({
            open: true,
            user: user
        });
    };

    const handleCloseUserDetail = () => {
        setUserDetailModal({
            open: false,
            user: null
        });
    };

    const getUserTypeIcon = (userType) => {
        return userType === 'PROVIDER' ? <BusinessIcon /> : <PersonIcon />;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getFullName = (user) => {
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        return fullName || user.username || 'N/A';
    };

    // Sort the filtered users
    const sortedUsers = filteredUsers.sort((a, b) => {
        let aVal = a[orderBy];
        let bVal = b[orderBy];
        
        if (orderBy === 'full_name') {
            aVal = getFullName(a);
            bVal = getFullName(b);
        }
        
        if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
        }
        
        if (order === 'asc') {
            return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        } else {
            return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        }
    });

    const paginatedUsers = sortedUsers.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

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

    return (
        <AdminLayout>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h3" component="h1" gutterBottom>
                    Manage Users
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                    View and manage all platform users and providers
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                {/* Search and Filter Section */}
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Search & Filter
                    </Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Search users..."
                                variant="outlined"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Name, email, username..."
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth>
                                <InputLabel>User Type</InputLabel>
                                <Select
                                    value={userTypeFilter}
                                    label="User Type"
                                    onChange={(e) => setUserTypeFilter(e.target.value)}
                                >
                                    <MenuItem value="">All Types</MenuItem>
                                    <MenuItem value="CUSTOMER">Customers</MenuItem>
                                    <MenuItem value="PROVIDER">Providers</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={statusFilter}
                                    label="Status"
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <MenuItem value="">All Statuses</MenuItem>
                                    <MenuItem value="ACTIVE">Active</MenuItem>
                                    <MenuItem value="SUSPENDED">Suspended</MenuItem>
                                    <MenuItem value="PENDING">Pending Verification</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Users Table */}
                <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                    <TableContainer>
                        <Table stickyHeader aria-label="users table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>
                                        <TableSortLabel
                                            active={orderBy === 'id'}
                                            direction={orderBy === 'id' ? order : 'asc'}
                                            onClick={() => handleSort('id')}
                                        >
                                            User ID
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={orderBy === 'full_name'}
                                            direction={orderBy === 'full_name' ? order : 'asc'}
                                            onClick={() => handleSort('full_name')}
                                        >
                                            Full Name / Username
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={orderBy === 'email'}
                                            direction={orderBy === 'email' ? order : 'asc'}
                                            onClick={() => handleSort('email')}
                                        >
                                            Email
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>User Type</TableCell>
                                    <TableCell>Provider Status</TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={orderBy === 'status'}
                                            direction={orderBy === 'status' ? order : 'asc'}
                                            onClick={() => handleSort('status')}
                                        >
                                            Status
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={orderBy === 'date_joined'}
                                            direction={orderBy === 'date_joined' ? order : 'asc'}
                                            onClick={() => handleSort('date_joined')}
                                        >
                                            Date Joined
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedUsers.map((user) => (
                                    <TableRow 
                                        key={user.id} 
                                        hover 
                                        onClick={() => handleRowClick(user)}
                                        sx={{ cursor: 'pointer' }}
                                    >
                                        <TableCell>#{user.id}</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {getUserTypeIcon(user.user_type)}
                                                <Box>
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {getFullName(user)}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        @{user.username}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={user.user_type}
                                                color={user.user_type === 'PROVIDER' ? 'primary' : 'default'}
                                                size="small"
                                                icon={getUserTypeIcon(user.user_type)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {user.user_type === 'PROVIDER' && user.provider_profile ? (
                                                <Chip
                                                    label={user.provider_profile.is_verified ? 'Verified' : 'Unverified'}
                                                    color={user.provider_profile.is_verified ? 'success' : 'warning'}
                                                    size="small"
                                                    icon={user.provider_profile.is_verified ? <VerifyIcon /> : null}
                                                />
                                            ) : (
                                                <Typography variant="caption" color="text.secondary">
                                                    N/A
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={getUserStatus(user)}
                                                color={getStatusColor(user)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>{formatDate(user.date_joined)}</TableCell>
                                        <TableCell>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {/* Show VERIFY button if user is a provider and is NOT verified */}
                                                {user.user_type === 'PROVIDER' && user.provider_profile && !user.provider_profile.is_verified && (
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        color="secondary"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleVerify(user);
                                                        }}
                                                    >
                                                        Verify
                                                    </Button>
                                                )}

                                                {/* Show SUSPEND button if user IS active */}
                                                {user.is_active && !user.is_superuser && (
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        color="error"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSuspend(user);
                                                        }}
                                                    >
                                                        Suspend
                                                    </Button>
                                                )}

                                                {/* Show ACTIVATE button if user is NOT active */}
                                                {!user.is_active && (
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        color="success"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleActivate(user);
                                                        }}
                                                    >
                                                        Activate
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        component="div"
                        count={filteredUsers.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </Paper>

                {/* Confirmation Dialog */}
                <Dialog
                    open={confirmDialog.open}
                    onClose={handleCloseConfirmDialog}
                    aria-labelledby="confirm-dialog-title"
                    aria-describedby="confirm-dialog-description"
                >
                    <DialogTitle id="confirm-dialog-title">
                        {confirmDialog.title}
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText id="confirm-dialog-description">
                            {confirmDialog.message}
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseConfirmDialog} disabled={actionLoading}>
                            Cancel
                        </Button>
                        <Button
                            onClick={executeAction}
                            disabled={actionLoading}
                            variant="contained"
                            color={confirmDialog.action === 'suspend' ? 'error' : 'primary'}
                        >
                            {actionLoading ? <CircularProgress size={20} /> : 'Confirm'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* User Detail Modal */}
                <Modal
                    open={userDetailModal.open}
                    onClose={handleCloseUserDetail}
                    aria-labelledby="user-detail-modal-title"
                >
                    <Box sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 500,
                        bgcolor: 'background.paper',
                        border: '2px solid #000',
                        boxShadow: 24,
                        p: 4,
                        borderRadius: 2,
                        maxHeight: '80vh',
                        overflow: 'auto'
                    }}>
                        {userDetailModal.user && (
                            <>
                                <Typography id="user-detail-modal-title" variant="h5" component="h2" gutterBottom>
                                    User Details
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">Full Name:</Typography>
                                        <Typography variant="body1">{getFullName(userDetailModal.user)}</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">Username:</Typography>
                                        <Typography variant="body1">@{userDetailModal.user.username}</Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant="body2" color="text.secondary">Email:</Typography>
                                        <Typography variant="body1">{userDetailModal.user.email}</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">Phone Number:</Typography>
                                        <Typography variant="body1">{userDetailModal.user.phone_number || 'N/A'}</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">User Type:</Typography>
                                        <Chip
                                            label={userDetailModal.user.user_type}
                                            color={userDetailModal.user.user_type === 'PROVIDER' ? 'primary' : 'default'}
                                            size="small"
                                            icon={getUserTypeIcon(userDetailModal.user.user_type)}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">Account Status:</Typography>
                                        <Chip
                                            label={getUserStatus(userDetailModal.user)}
                                            color={getStatusColor(userDetailModal.user)}
                                            size="small"
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" color="text.secondary">Date Joined:</Typography>
                                        <Typography variant="body1">{formatDate(userDetailModal.user.date_joined)}</Typography>
                                    </Grid>
                                    {userDetailModal.user.user_type === 'PROVIDER' && userDetailModal.user.provider_profile && (
                                        <>
                                            <Grid item xs={12}>
                                                <Typography variant="h6" sx={{ mt: 2 }}>Provider Information</Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="text.secondary">Verification Status:</Typography>
                                                <Chip
                                                    label={userDetailModal.user.provider_profile.is_verified ? 'Verified' : 'Unverified'}
                                                    color={userDetailModal.user.provider_profile.is_verified ? 'success' : 'warning'}
                                                    size="small"
                                                    icon={userDetailModal.user.provider_profile.is_verified ? <VerifyIcon /> : null}
                                                />
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="text.secondary">Service Offered:</Typography>
                                                <Typography variant="body1">
                                                    {userDetailModal.user.provider_profile.service_offered || 'Not specified'}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="text.secondary">Average Rating:</Typography>
                                                <Typography variant="body1">
                                                    {userDetailModal.user.provider_profile.average_rating || 'No ratings yet'}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="text.secondary">Total Bookings:</Typography>
                                                <Typography variant="body1">
                                                    {userDetailModal.user.total_bookings || 0}
                                                </Typography>
                                            </Grid>
                                        </>
                                    )}
                                </Grid>
                                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button onClick={handleCloseUserDetail} variant="contained">
                                        Close
                                    </Button>
                                </Box>
                            </>
                        )}
                    </Box>
                </Modal>
            </Container>
        </AdminLayout>
    );
};

export default ManageUsers;
