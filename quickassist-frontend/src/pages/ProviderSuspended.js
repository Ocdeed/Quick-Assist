// In src/pages/ProviderSuspended.js
import React from 'react';
import {
    Container,
    Typography,
    Alert,
    Box,
    Button,
    Paper
} from '@mui/material';
import {
    Block as SuspendIcon,
    Support as SupportIcon
} from '@mui/icons-material';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';

const ProviderSuspended = () => {
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
    };

    return (
        <Box>
            <Header />
            <Container maxWidth="md" sx={{ mt: 6, mb: 4 }}>
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Box sx={{ mb: 3 }}>
                        <SuspendIcon 
                            sx={{ 
                                fontSize: 80, 
                                color: 'error.main',
                                mb: 2 
                            }} 
                        />
                        <Typography variant="h3" component="h1" color="error.main" gutterBottom>
                            Account Suspended
                        </Typography>
                    </Box>

                    <Alert severity="error" sx={{ mb: 4, textAlign: 'left' }}>
                        <Typography variant="h6" gutterBottom>
                            Your provider account is currently suspended
                        </Typography>
                        <Typography variant="body1">
                            You cannot go on duty or receive new job requests while your account is suspended. 
                            This may be due to policy violations, customer complaints, or other issues that require review.
                        </Typography>
                    </Alert>

                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" gutterBottom>
                            What happens now?
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                            • You cannot receive new job requests
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                            • You cannot go on duty
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                            • Your profile is not visible to customers
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            • You can still view your account information
                        </Typography>
                    </Box>

                    <Alert severity="info" sx={{ mb: 4, textAlign: 'left' }}>
                        <Typography variant="body1">
                            <SupportIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                            <strong>Need Help?</strong> Please contact our support team at support@quickassist.com 
                            or call +255 123 456 789 for assistance with your account status.
                        </Typography>
                    </Alert>

                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                        <Button
                            variant="outlined"
                            onClick={handleLogout}
                            size="large"
                        >
                            Sign Out
                        </Button>
                        <Button
                            variant="contained"
                            href="mailto:support@quickassist.com"
                            startIcon={<SupportIcon />}
                            size="large"
                        >
                            Contact Support
                        </Button>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default ProviderSuspended;
