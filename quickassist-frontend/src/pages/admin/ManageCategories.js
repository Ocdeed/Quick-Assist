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
  Snackbar
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import axios from '../../api/axios';
import AdminLayout from '../../components/AdminLayout';

const ManageCategories = () => {
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCategory, setCurrentCategory] = useState({ name: '', icon_name: '' });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/categories/');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showSnackbar('Error fetching categories', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreate = () => {
    setEditMode(false);
    setCurrentCategory({ name: '', icon_name: '' });
    setOpen(true);
  };

  const handleEdit = (category) => {
    setEditMode(true);
    setCurrentCategory(category);
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await axios.delete(`/admin/categories/${id}/`);
        showSnackbar('Category deleted successfully', 'success');
        fetchCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
        showSnackbar('Error deleting category', 'error');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      if (editMode) {
        await axios.put(`/admin/categories/${currentCategory.id}/`, {
          name: currentCategory.name,
          icon_name: currentCategory.icon_name
        });
        showSnackbar('Category updated successfully', 'success');
      } else {
        await axios.post('/admin/categories/', {
          name: currentCategory.name,
          icon_name: currentCategory.icon_name
        });
        showSnackbar('Category created successfully', 'success');
      }
      
      setOpen(false);
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      showSnackbar('Error saving category', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentCategory({ name: '', icon_name: '' });
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <AdminLayout>
      <Box p={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Manage Categories
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={handleCreate}
          >
            Add Category
          </Button>
        </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Icon Name</TableCell>
              <TableCell>Services Count</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>{category.id}</TableCell>
                <TableCell>{category.name}</TableCell>
                <TableCell>{category.icon_name}</TableCell>
                <TableCell>{category.services_count}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(category)} color="primary">
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(category.id)} color="error">
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
          {editMode ? 'Edit Category' : 'Add New Category'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            fullWidth
            variant="outlined"
            value={currentCategory.name}
            onChange={(e) => setCurrentCategory({ ...currentCategory, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Icon Name"
            fullWidth
            variant="outlined"
            value={currentCategory.icon_name}
            onChange={(e) => setCurrentCategory({ ...currentCategory, icon_name: e.target.value })}
            helperText="Material-UI icon name (e.g., 'build', 'home', 'cleaning_services')"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading || !currentCategory.name.trim()}
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

export default ManageCategories;
