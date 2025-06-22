// In src/components/ServiceCard.js
import React from 'react';
import { Card, CardContent, Typography, Button, CardActions } from '@mui/material';
import MiscellaneousServicesIcon from '@mui/icons-material/MiscellaneousServices'; // Example icon

const ServiceCard = ({ service, onBook }) => {
    return (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
                <MiscellaneousServicesIcon sx={{ mb: 1 }} />
                <Typography gutterBottom variant="h5" component="h2">
                    {service.name}
                </Typography>
                <Typography>
                    {service.description}
                </Typography>
            </CardContent>
            <CardActions>
                <Button size="small" variant="contained" onClick={() => onBook(service)}>
                    Book Now
                </Button>
            </CardActions>
        </Card>
    );
};

export default ServiceCard;