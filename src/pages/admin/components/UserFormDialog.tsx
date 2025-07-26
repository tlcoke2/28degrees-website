import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, FormControl, InputLabel,
  Select, MenuItem, CircularProgress, Box,
  SelectChangeEvent
} from '@mui/material';
import { User } from '../../../services/api';

export interface UserFormData {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin' | 'guide';
  status: 'active' | 'inactive' | 'suspended';
  password?: string;
  confirmPassword?: string;
  avatar?: string;
  joinDate: string;
  lastLogin?: string;
}

// Default form values
const defaultFormData: UserFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: 'user',
  status: 'active',
  password: '',
  confirmPassword: '',
  joinDate: new Date().toISOString(),
};

interface UserFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (userData: UserFormData) => void;
  formData: UserFormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onRoleChange: (e: SelectChangeEvent<string>) => void;
  onStatusChange: (e: SelectChangeEvent<string>) => void;
  loading: boolean;
  editMode: boolean;
}

export const UserFormDialog: React.FC<UserFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  formData,
  onInputChange,
  onRoleChange,
  onStatusChange,
  loading,
  editMode
}) => (
  <Dialog 
    open={open} 
    onClose={loading ? undefined : onClose} 
    maxWidth="sm" 
    fullWidth
    aria-labelledby="user-form-dialog-title"
  >
    <DialogTitle id="user-form-dialog-title">
      {editMode ? 'Edit User' : 'Add New User'}
    </DialogTitle>
    <DialogContent>
      <Box mt={2}>
        <Box display="flex" gap={2}>
          <TextField
            fullWidth
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={onInputChange}
            margin="normal"
            required
            disabled={loading}
          />
          <TextField
            fullWidth
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={onInputChange}
            margin="normal"
            required
            disabled={loading}
          />
        </Box>
        <TextField
          fullWidth
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={onInputChange}
          margin="normal"
          required
          disabled={editMode}
        />
        <TextField
          fullWidth
          label="Phone"
          name="phone"
          value={formData.phone}
          onChange={onInputChange}
          margin="normal"
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Role</InputLabel>
          <Select
            value={formData.role}
            onChange={onRoleChange}
            label="Role"
            required
          >
            <MenuItem value="user">User</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="guide">Guide</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth margin="normal">
          <InputLabel>Status</InputLabel>
          <Select
            value={formData.status}
            onChange={onStatusChange}
            label="Status"
            required
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
            <MenuItem value="suspended">Suspended</MenuItem>
          </Select>
        </FormControl>
        {!editMode && (
          <>
            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={onInputChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={onInputChange}
              margin="normal"
              required
              error={
                formData.password !== formData.confirmPassword &&
                formData.confirmPassword !== ''
              }
              helperText={
                formData.password !== formData.confirmPassword &&
                formData.confirmPassword !== ''
                  ? 'Passwords do not match'
                  : ''
              }
            />
          </>
        )}
      </Box>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={loading}>
        Cancel
      </Button>
      <Button
        onClick={() => {
          const { confirmPassword, ...submitData } = formData;
          onSubmit(submitData);
        }}
        variant="contained"
        color="primary"
        disabled={
          loading ||
          !formData.firstName?.trim() ||
          !formData.lastName?.trim() ||
          !formData.email?.trim() ||
          (!editMode && (!formData.password || formData.password !== formData.confirmPassword))
        }
      >
        {loading ? <CircularProgress size={24} /> : 'Save'}
      </Button>
    </DialogActions>
  </Dialog>
);
