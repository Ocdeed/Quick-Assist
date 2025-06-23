// In src/components/ServiceCategoryList.js
import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import { Grid, Typography, Box, CircularProgress, Alert } from '@mui/material';
import ServiceCard from './ServiceCard';

// We'll pass the onBook function from the dashboard along with search/filter props
const ServiceCategoryList = ({ onBook, searchTerm = '', selectedCategory = '' }) => {
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

    // Filter services based on search term and selected category
    const filteredServiceData = serviceData.map(category => {
        // If a specific category is selected, only show that category
        if (selectedCategory && category.id !== parseInt(selectedCategory)) {
            return null;
        }

        // Filter services within the category based on search term
        const filteredServices = category.services.filter(service =>
            service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            service.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Only return category if it has matching services
        if (filteredServices.length > 0) {
            return {
                ...category,
                services: filteredServices
            };
        }
        return null;
    }).filter(Boolean); // Remove null categories

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }    return (
        <Box>
            {filteredServiceData.length === 0 && !loading && !error ? (
                <Typography variant="h6" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                    No services found matching your criteria.
                </Typography>
            ) : (
                filteredServiceData.map((category) => (
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
                ))
            )}
        </Box>
    );
};

export default ServiceCategoryList;