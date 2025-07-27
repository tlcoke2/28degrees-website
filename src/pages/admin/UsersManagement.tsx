import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, Typography, Paper, Snackbar, Alert } from '@mui/material';
import { PersonAdd as PersonAddIcon } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { userService, type User as ApiUser } from '../../services/api';
import type { AxiosError } from 'axios';
import { UserFormDialog } from './components/UserFormDialog';
import { UsersTable } from './components/UsersTable';
import type { UserFormData as UserFormDialogData } from './components/UserFormDialog';

// Types
type User = ApiUser & { id: string };

const defaultFormData: UserFormDialogData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: 'user',
  status: 'active',
  password: '',
  confirmPassword: '',
  joinDate: new Date().toISOString()
};

const UsersManagement: React.FC = () => {
  const { user: currentUser, isAdmin } = useAuth();
  
  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [pagination, setPagination] = useState({
    page: 0,
    rowsPerPage: 10,
    count: 0
  });
  const [formData, setFormData] = useState<UserFormDialogData>(defaultFormData);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  const showSnackbar = useCallback((message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await userService.getAllUsers(
        pagination.page + 1,
        pagination.rowsPerPage,
        {}
      );
      // Ensure each user has an id property
      const usersWithId = response.data.map(user => ({
        ...user,
        id: user.id || ''
      }));
      
      setUsers(usersWithId);
      setPagination(prev => ({
        ...prev,
        count: response.total || 0
      }));
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      setError(error.response?.data?.message || 'Failed to fetch users');
      showSnackbar(error.response?.data?.message || 'Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.rowsPerPage]);

  const handleSaveUser = async (formData: UserFormDialogData) => {
    try {
      setLoading(true);
      
      if (editMode && selectedUser) {
        // Update existing user
        const { password, confirmPassword, ...updateData } = formData;
        await userService.updateUser(selectedUser.id, updateData);
        showSnackbar('User updated successfully');
      } else if (formData.password) {
        // Create new user
        const { confirmPassword, ...createData } = formData;
        await userService.createUser({
          ...createData,
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          password: formData.password
        });
        showSnackbar('User created successfully');
      } else {
        throw new Error('Password is required for new users');
      }
      
      setOpenDialog(false);
      fetchUsers();
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      showSnackbar(error.response?.data?.message || 'Failed to save user', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: User['status']) => {
    try {
      setLoading(true);
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await userService.updateUserStatus(userId, newStatus);
      
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, status: newStatus } : user
        )
      );
      
      showSnackbar(`User status updated to ${newStatus}`);
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      showSnackbar(error.response?.data?.message || 'Failed to update user status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (_event: unknown, newPage: number) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPagination(prev => ({
      ...prev,
      rowsPerPage: parseInt(event.target.value, 10),
      page: 0
    }));
  };

  // Update form data when selected user changes
  useEffect(() => {
    if (editMode && selectedUser) {
      const nameParts = selectedUser.name ? selectedUser.name.split(' ') : ['', ''];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      setFormData({
        firstName,
        lastName,
        email: selectedUser.email || '',
        phone: selectedUser.phone || '',
        role: selectedUser.role || 'user',
        status: selectedUser.status || 'active',
        joinDate: selectedUser.joinDate || new Date().toISOString(),
        password: '',
        confirmPassword: ''
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [editMode, selectedUser]);

  const handleDeleteUser = async (userId: string) => {
    try {
      setLoading(true);
      await userService.deleteUser(userId);
      showSnackbar('User deleted successfully');
      fetchUsers();
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      showSnackbar(error.response?.data?.message || 'Failed to delete user', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditMode(true);
    setOpenDialog(true);
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Users Management</Typography>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => {
              setSelectedUser(null);
              setEditMode(false);
              setOpenDialog(true);
            }}
            disabled={loading}
          >
            Add User
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <UsersTable
        users={users}
        loading={loading}
        pagination={pagination}
        currentUserId={currentUser?.uid || ''}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
        onStatusToggle={handleStatusToggle}
        isAdmin={isAdmin || false}
      />

      <UserFormDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onSubmit={handleSaveUser}
        formData={formData}
        loading={loading}
        editMode={editMode}
        onInputChange={(e) => {
          const { name, value } = e.target;
          setFormData(prev => ({
            ...prev,
            [name]: value
          }));
        }}
        onRoleChange={(e) => {
          setFormData(prev => ({
            ...prev,
            role: e.target.value as 'user' | 'admin' | 'guide'
          }));
        }}
        onStatusChange={(e) => {
          setFormData(prev => ({
            ...prev,
            status: e.target.value as 'active' | 'inactive' | 'suspended'
          }));
        }}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          severity={snackbar.severity}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default UsersManagement;
