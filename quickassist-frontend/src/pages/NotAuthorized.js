// In src/pages/NotAuthorized.js
import React from 'react';
import { Container, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Lock as LockIcon } from '@mui/icons-material';

const NotAuthorized = () => {
    const navigate = useNavigate();

    return (
        <Container maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
            <Box sx={{ mb: 4 }}>
                <LockIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
                <Typography variant="h3" component="h1" gutterBottom>
                    Access Denied
                </Typography>
                <Typography variant="h6" color="text.secondary" paragraph>
                    You don't have permission to access this area.
                </Typography>
                <Typography color="text.secondary" paragraph>
                    This section is restricted to administrators only.
                </Typography>
            </Box>
            <Button 
                variant="contained" 
                size="large"
                onClick={() => navigate('/')}
                sx={{ mt: 2 }}
            >
                Return to Dashboard
            </Button>
        </Container>
    );
};

export default NotAuthorized;
