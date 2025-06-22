// In src/components/ServiceCategoryList.js
import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import { Grid, Typography, Box, CircularProgress, Alert } from '@mui/material';
import ServiceCard from './ServiceCard';

// We'll pass the onBook function from the dashboard
const ServiceCategoryList = ({ onBook }) => {
    const [serviceData, setServiceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const response = await axiosInstance.get('/services/');
                setServiceData(response.data);
            } catch (err) {
                setError('Failed to load services. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        fetchServices();
    }, []);

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    return (
        <Box>
            {serviceData.map((category) => (
                <Box key={category.id} sx={{ mb: 5 }}>
                    <Typography variant="h4" component="h2" gutterBottom>
                        {category.name}
                    </Typography>
                    <Grid container spacing={4}>
                        {category.services.map((service) => (
                            <Grid item key={service.id} xs={12} sm={6} md={4}>
                                <ServiceCard service={service} onBook={onBook} />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            ))}
        </Box>
    );
};

export default ServiceCategoryList;