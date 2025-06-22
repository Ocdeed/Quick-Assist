// In src/components/AuthLayout.js
import React from 'react';
import { Container, Box, Typography, Paper } from '@mui/material';

const AuthLayout = ({ children, title }) => {
    return (
        <Container component="main" maxWidth="xs">
            <Paper
                elevation={3}
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: 4,
                }}
            >
                <Typography component="h1" variant="h5">
                    {title}
                </Typography>
                <Box sx={{ mt: 3, width: '100%' }}>
                    {children}
                </Box>
            </Paper>
        </Container>
    );
};

export default AuthLayout;