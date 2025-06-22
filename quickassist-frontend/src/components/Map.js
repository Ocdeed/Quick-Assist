// In src/components/Map.js
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import PersonPinCircleIcon from '@mui/icons-material/PersonPinCircle';
import SportsMotorsportsIcon from '@mui/icons-material/SportsMotorsports';
import { renderToStaticMarkup } from 'react-dom/server';

// --- Leaflet Icon Fix ---
// This is a common fix for Leaflet icons not appearing correctly in React.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Helper to create custom markers from MUI icons
const createMuiIcon = (IconComponent, props) => {
    const iconMarkup = renderToStaticMarkup(<IconComponent {...props} />);
    return L.divIcon({
        html: iconMarkup,
        className: '', // Override default leaflet-div-icon styles
        iconSize: [40, 40],
        iconAnchor: [20, 40], // Point of the icon which will correspond to marker's location
    });
};

const customerIcon = createMuiIcon(PersonPinCircleIcon, { sx: { color: 'blue', fontSize: 40 } });
const providerIcon = createMuiIcon(SportsMotorsportsIcon, { sx: { color: 'red', fontSize: 40 } });

// A component to update the map's view when its center or zoom needs to change
const MapUpdater = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        // Ensure center has valid lat/lng before calling setView
        if (center && typeof center.lat === 'number' && typeof center.lng === 'number') {
            map.setView(center, zoom);
        }
    }, [center, zoom, map]);
    return null;
};

const MapComponent = ({ customerLocation, providerLocation }) => {
    // Helper to safely create a lat/lng object only if coordinates are valid numbers
    const createLatLng = (location) => {
        if (location && typeof location.latitude === 'number' && typeof location.longitude === 'number') {
            return { lat: location.latitude, lng: location.longitude };
        }
        return null;
    };

    const customerPos = createLatLng(customerLocation);
    const providerPos = createLatLng(providerLocation);

    // The map should center on the provider if available, otherwise the customer.
    const mapCenter = providerPos || customerPos;
    const zoomLevel = providerPos ? 15 : 14;

    if (!customerPos) {
        // Don't render map if there's no valid initial customer location
        return <div>Loading map data...</div>;
    }

    return (
        <MapContainer center={customerPos} zoom={14} style={{ height: '100%', width: '100%' }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapUpdater center={mapCenter} zoom={zoomLevel} />

            {/* Customer Marker */}
            {customerPos && (
                <Marker position={customerPos} icon={customerIcon} />
            )}

            {/* Provider Marker */}
            {providerPos && (
                <Marker position={providerPos} icon={providerIcon} />
            )}
        </MapContainer>
    );
};

export default MapComponent;