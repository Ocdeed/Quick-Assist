/* eslint-disable no-unused-vars */
// In src/components/Header.js
import React, { useState } from 'react';
import { 
    AppBar, Toolbar, Typography, Box, IconButton, Menu, MenuItem, Button
} from '@mui/material';
import { 
    AccountCircle, 
    History as HistoryIcon, 
    Home as HomeIcon 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };    const handleLogout = () => {
        logout();
        navigate('/login');
        handleClose();
    };

    const handleProfile = () => {
        navigate('/profile');
        handleClose();
    };

    const handleHistory = () => {
        navigate('/history');
        handleClose();
    };    const handleHome = () => {
        navigate('/');
    };

    const handleProviderProfile = () => {
        navigate('/provider/profile');
        handleClose();
    };

    const isProvider = user?.user_type === 'PROVIDER';return (
        <AppBar position="static">
            <Toolbar>
                <IconButton
                    edge="start"
                    color="inherit"
                    aria-label="home"
                    onClick={handleHome}
                    sx={{ mr: 2 }}
                >
                    <HomeIcon />
                </IconButton>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    QUICKASSIST
                </Typography>
                  {/* Navigation buttons for larger screens */}
                <Box sx={{ display: { xs: 'none', md: 'flex' }, mr: 2 }}>
                    {!isProvider && (
                        <Button
                            color="inherit"
                            startIcon={<HistoryIcon />}
                            onClick={handleHistory}
                        >
                            History
                        </Button>
                    )}
                </Box>

                <div>
                    <IconButton
                        size="large"
                        aria-label="account of current user"
                        aria-controls="menu-appbar"
                        aria-haspopup="true"
                        onClick={handleMenu}
                        color="inherit"
                    >
                        <AccountCircle />
                    </IconButton>
                    <Menu
                        id="menu-appbar"
                        anchorEl={anchorEl}
                        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                        keepMounted
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}                        open={open}
                        onClose={handleClose}
                    >
                        {!isProvider && (
                            <MenuItem onClick={handleHistory} sx={{ display: { md: 'none' } }}>
                                <HistoryIcon sx={{ mr: 1 }} />
                                Booking History
                            </MenuItem>
                        )}
                        <MenuItem onClick={isProvider ? handleProviderProfile : handleProfile}>
                            <AccountCircle sx={{ mr: 1 }} />
                            Profile
                        </MenuItem>
                        <MenuItem onClick={handleLogout}>Logout</MenuItem>
                    </Menu>
                </div>
            </Toolbar>
        </AppBar>
    );
};

export default Header;