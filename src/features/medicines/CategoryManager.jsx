import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { createCategory, updateCategory, deleteCategory } from './medicineService';

export default function CategoryManager({ open, onClose, categories, onRefresh }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName('');
    setDescription('');
    setEditingId(null);
    setError('');
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (editingId) {
        await updateCategory(editingId, { name: name.trim(), description: description.trim() });
      } else {
        await createCategory({ name: name.trim(), description: description.trim() });
      }
      resetForm();
      onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setName(cat.name);
    setDescription(cat.description || '');
  };

  const handleDelete = async (id) => {
    setLoading(true);
    setError('');
    try {
      await deleteCategory(id);
      onRefresh();
    } catch (err) {
      setError(
        err.message.includes('violates foreign key')
          ? 'Cannot delete: category is in use by medicines'
          : err.message,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Manage Categories</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 1, mb: 2, mt: 1 }}>
          <TextField
            size="small"
            label="Category Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ flex: 1 }}
          />
          <TextField
            size="small"
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ flex: 1 }}
          />
          <Button variant="contained" onClick={handleSave} disabled={loading} size="small">
            {editingId ? 'Update' : 'Add'}
          </Button>
          {editingId && (
            <Button size="small" onClick={resetForm}>
              Cancel
            </Button>
          )}
        </Box>

        {categories.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            No categories yet
          </Typography>
        ) : (
          <List dense>
            {categories.map((cat) => (
              <ListItem
                key={cat.id}
                secondaryAction={
                  <Box>
                    <IconButton size="small" onClick={() => handleEdit(cat)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(cat.id)} color="error">
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText primary={cat.name} secondary={cat.description} />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
