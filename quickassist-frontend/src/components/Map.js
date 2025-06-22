// In src/components/Map.js
import React, { useState } from 'react';
import ReactMapGL, { Marker } from 'react-map-gl'; // This import now works with v6
import 'mapbox-gl/dist/mapbox-gl.css';
import PersonPinCircleIcon from '@mui/icons-material/PersonPinCircle';
import SportsMotorsportsIcon from '@mui/icons-material/SportsMotorsports';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

const MapComponent = ({ customerLocation, providerLocation }) => {
    const [viewport, setViewport] = useState({
        // Set the initial center of the map based on customer's location
        latitude: customerLocation.latitude,
        longitude: customerLocation.longitude,
        zoom: 14,
        width: '100%',
        height: '100%'
    });

    return (
        <ReactMapGL
            // {...viewport}
            // mapStyle="mapbox://styles/mapbox/streets-v11"
            // mapboxApiAccessToken={MAPBOX_TOKEN} // Note: prop name is mapboxApiAccessToken in v6
            // onViewportChange={nextViewport => setViewport(nextViewport)}
            latitude={viewport.latitude}
            longitude={viewport.longitude}
            zoom={viewport.zoom}
            width={viewport.width}
            height={viewport.height}
            mapStyle="mapbox://styles/mapbox/streets-v11"
            mapboxApiAccessToken={MAPBOX_TOKEN}
            onViewportChange={nextViewport => setViewport(prev => ({...prev, ...nextViewport}))}
        >
            {/* Customer Marker */}
            {customerLocation && (
                <Marker longitude={customerLocation.longitude} latitude={customerLocation.latitude}>
                    <PersonPinCircleIcon sx={{ color: 'blue', fontSize: 40 }} />
                </Marker>
            )}

            {/* Provider Marker */}
            {providerLocation && (
                <Marker longitude={providerLocation.longitude} latitude={providerLocation.latitude}>
                    <SportsMotorsportsIcon sx={{ color: 'red', fontSize: 40 }} />
                </Marker>
            )}
        </ReactMapGL>
    );
};

export default MapComponent;