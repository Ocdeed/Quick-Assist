// In src/components/StatCard.js
import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

const StatCard = ({ title, value, icon, color = 'primary' }) => {
    return (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', p: 3 }}>
                <Box sx={{ mb: 2, color: `${color}.main` }}>
                    {icon}
                </Box>
                <Typography variant="h4" component="div" fontWeight="bold" color={`${color}.main`} gutterBottom>
                    {value}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                    {title}
                </Typography>
            </CardContent>
        </Card>
    );
};

export default StatCard;
