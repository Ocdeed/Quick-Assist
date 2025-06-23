// In src/pages/admin/ManageUsers.js
import React, { useState, useEffect } from 'react';
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
    IconButton,
    Menu,
    ListItemText,
    ListItemIcon,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button
} from '@mui/material';
import {
    MoreVert as MoreVertIcon,
    CheckCircle as ApproveIcon,
    Block as SuspendIcon,
    PlayArrow as ActivateIcon,
    Person as PersonIcon,
    Business as BusinessIcon
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
    
    // Action menu state
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    
    // Confirmation dialog state
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: '',
        message: '',
        action: null,
        user: null
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        filterUsers();
    }, [users, searchTerm, userTypeFilter, statusFilter]);

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

    const filterUsers = () => {
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
            filtered = filtered.filter(user => user.status === statusFilter);
        }

        setFilteredUsers(filtered);
    };

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

    const handleActionMenu = (event, user) => {
        setAnchorEl(event.currentTarget);
        setSelectedUser(user);
    };

    const handleCloseActionMenu = () => {
        setAnchorEl(null);
        setSelectedUser(null);
    };

    const handleConfirmAction = (action, user, title, message) => {
        setConfirmDialog({
            open: true,
            title,
            message,
            action,
            user
        });
        handleCloseActionMenu();
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
            await axiosInstance.post(`/admin/users/${user.id}/${action}/`);
            
            // Refresh users list
            await fetchUsers();
            setSuccess(`User ${action} successful!`);
        } catch (err) {
            console.error(`Failed to ${action} user:`, err);
            setError(`Failed to ${action} user. Please try again.`);
        } finally {
            setActionLoading(false);
            handleCloseConfirmDialog();
        }
    };

    const getStatusColor = (status) => {
        const statusColors = {
            'ACTIVE': 'success',
            'SUSPENDED': 'error',
            'PENDING': 'warning',
            'INACTIVE': 'default'
        };
        return statusColors[status] || 'default';
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
                                    <MenuItem value="PENDING">Pending</MenuItem>
                                    <MenuItem value="INACTIVE">Inactive</MenuItem>
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
                                    <TableRow key={user.id} hover>
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
                                            <Chip
                                                label={user.status}
                                                color={getStatusColor(user.status)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>{formatDate(user.date_joined)}</TableCell>
                                        <TableCell>
                                            <IconButton
                                                onClick={(e) => handleActionMenu(e, user)}
                                                size="small"
                                            >
                                                <MoreVertIcon />
                                            </IconButton>
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

                {/* Action Menu */}
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleCloseActionMenu}
                >
                    {selectedUser?.status !== 'ACTIVE' && (
                        <MenuItem
                            onClick={() =>
                                handleConfirmAction(
                                    'approve',
                                    selectedUser,
                                    'Approve User',
                                    `Are you sure you want to approve user ${getFullName(selectedUser)}?`
                                )
                            }
                        >
                            <ListItemIcon>
                                <ApproveIcon color="success" />
                            </ListItemIcon>
                            <ListItemText>Approve Account</ListItemText>
                        </MenuItem>
                    )}
                    {selectedUser?.status === 'ACTIVE' && (
                        <MenuItem
                            onClick={() =>
                                handleConfirmAction(
                                    'suspend',
                                    selectedUser,
                                    'Suspend User',
                                    `Are you sure you want to suspend user ${getFullName(selectedUser)}? This action will prevent them from using the platform.`
                                )
                            }
                        >
                            <ListItemIcon>
                                <SuspendIcon color="error" />
                            </ListItemIcon>
                            <ListItemText>Suspend Account</ListItemText>
                        </MenuItem>
                    )}
                    {selectedUser?.status === 'SUSPENDED' && (
                        <MenuItem
                            onClick={() =>
                                handleConfirmAction(
                                    'activate',
                                    selectedUser,
                                    'Activate User',
                                    `Are you sure you want to activate user ${getFullName(selectedUser)}?`
                                )
                            }
                        >
                            <ListItemIcon>
                                <ActivateIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText>Activate Account</ListItemText>
                        </MenuItem>
                    )}
                </Menu>

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
            </Container>
        </AdminLayout>
    );
};

export default ManageUsers;
