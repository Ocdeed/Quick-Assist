// In src/theme/theme.js
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2', // A classic blue
        },
        secondary: {
            main: '#dc004e', // A vibrant pink/red for accents
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontSize: '2.5rem' },
    },
});