import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import axios from '../../api/axios';
import AdminLayout from '../../components/AdminLayout';

const ManageServices = () => {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentService, setCurrentService] = useState({ 
    name: '', 
    description: '', 
    category: '', 
    estimated_base_price: '' 
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/services/');
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
      showSnackbar('Error fetching services', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get('/categories/');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showSnackbar('Error fetching categories', 'error');
    }
  }, []);

  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, [fetchServices, fetchCategories]);

  const handleCreate = () => {
    setEditMode(false);
    setCurrentService({ name: '', description: '', category: '', estimated_base_price: '' });
    setOpen(true);
  };

  const handleEdit = (service) => {
    setEditMode(true);
    setCurrentService(service);
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await axios.delete(`/admin/services/${id}/`);
        showSnackbar('Service deleted successfully', 'success');
        fetchServices();
      } catch (error) {
        console.error('Error deleting service:', error);
        showSnackbar('Error deleting service', 'error');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const serviceData = {
        name: currentService.name,
        description: currentService.description,
        category: currentService.category,
        estimated_base_price: parseFloat(currentService.estimated_base_price)
      };
      
      if (editMode) {
        await axios.put(`/admin/services/${currentService.id}/`, serviceData);
        showSnackbar('Service updated successfully', 'success');
      } else {
        await axios.post('/admin/services/', serviceData);
        showSnackbar('Service created successfully', 'success');
      }
      
      setOpen(false);
      fetchServices();
    } catch (error) {
      console.error('Error saving service:', error);
      showSnackbar('Error saving service', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentService({ name: '', description: '', category: '', estimated_base_price: '' });
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const isFormValid = () => {
    return currentService.name.trim() && 
           currentService.description.trim() && 
           currentService.category && 
           currentService.estimated_base_price && 
           !isNaN(parseFloat(currentService.estimated_base_price)) && 
           parseFloat(currentService.estimated_base_price) > 0;
  };

  return (
    <AdminLayout>
      <Box p={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Manage Services
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={handleCreate}
          >
            Add Service
          </Button>
        </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Base Price (Tsh)</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell>{service.id}</TableCell>
                <TableCell>{service.name}</TableCell>
                <TableCell>{service.description}</TableCell>
                <TableCell>{service.category_name}</TableCell>
                <TableCell>{service.estimated_base_price}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(service)} color="primary">
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(service.id)} color="error">
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editMode ? 'Edit Service' : 'Add New Service'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Service Name"
            fullWidth
            variant="outlined"
            value={currentService.name}
            onChange={(e) => setCurrentService({ ...currentService, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={currentService.description}
            onChange={(e) => setCurrentService({ ...currentService, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={currentService.category}
              label="Category"
              onChange={(e) => setCurrentService({ ...currentService, category: e.target.value })}
            >
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            margin="dense"
            label="Base Price"
            fullWidth
            variant="outlined"
            type="number"
            value={currentService.estimated_base_price}
            onChange={(e) => setCurrentService({ ...currentService, estimated_base_price: e.target.value })}
            InputProps={{
              startAdornment: <InputAdornment position="start">Tsh</InputAdornment>,
            }}
            helperText="Estimated base price for this service"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading || !isFormValid()}
          >
            {loading ? 'Saving...' : (editMode ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      </Box>
    </AdminLayout>
  );
};

export default ManageServices;
