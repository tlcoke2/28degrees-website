import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Button, Typography, Paper, CircularProgress,
  Snackbar, Alert, FormControl, InputLabel, Select,
  MenuItem, TextField, InputAdornment
} from '@mui/material';
import { Search as SearchIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/api';
import type { User } from '../../services/api';
import type { AxiosError } from 'axios';
import { UserFormDialog } from './components/UserFormDialog';
import { UsersTable } from './components/UsersTable';

// Define the user form data type with all required fields
export interface UserFormData {
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin' | 'guide';
  status: 'active' | 'inactive' | 'suspended';
  avatar?: string;
  joinDate: string;
  lastLogin?: string;
  password?: string;
  confirmPassword?: string;
}

const defaultFormData: UserFormData = {
  name: '',
  email: '',
  phone: '',
  role: 'user',
  status: 'active',
  avatar: '',
  joinDate: new Date().toISOString(),
  password: '',
  confirmPassword: ''
};

const UsersManagement: React.FC = () => {
  const { user: currentUser, isAdmin: isUserAdmin } = useAuth();
  
  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>(defaultFormData);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });
  const [pagination, setPagination] = useState({
    page: 0,
    rowsPerPage: 10,
    count: 0
  });

  // Show snackbar message
  const showSnackbar = useCallback((message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);
  
  // Close snackbar
  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);
  
  // Handle input change for form fields
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);
  
  // Handle role change in form
  const handleRoleChange = useCallback((e: any) => {
    setFormData(prev => ({ ...prev, role: e.target.value }));
  }, []);
  
  // Handle status change in form
  const handleStatusChange = useCallback((e: any) => {
    setFormData(prev => ({ ...prev, status: e.target.value }));
  }, []);
  
  // Open dialog for adding/editing user
  const handleOpenDialog = useCallback((user: User | null = null) => {
    if (user) {
      setSelectedUser(user);
      setEditMode(true);
      // Don't include password fields when editing
      const { ...userData } = user;
      setFormData({
        ...userData,
        password: '',
        confirmPassword: ''
      });
    } else {
      setSelectedUser(null);
      setEditMode(false);
      setFormData(defaultFormData);
    }
    setOpenDialog(true);
  }, []);
  
  // Close dialog
  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setFormData(defaultFormData);
    setSelectedUser(null);
  }, []);

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    if (!isUserAdmin) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {
        page: pagination.page + 1,
        limit: pagination.rowsPerPage,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined
      };
      
      const response = await userService.getAllUsers(
        params.page,
        params.limit,
        {
          ...(params.role && { role: params.role }),
          ...(params.status && { status: params.status }),
          ...(params.search && { search: params.search })
        }
      );
      setUsers(response.data);
      setPagination(prev => ({
        ...prev,
        count: response.total,
        totalPages: response.totalPages
      }));
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || 'Failed to fetch users');
      showSnackbar(error.response?.data?.message || 'Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.rowsPerPage, roleFilter, statusFilter, searchTerm, showSnackbar, isUserAdmin]);

  // Handle pagination
  const handleChangePage = useCallback((_: unknown, newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setPagination(prev => ({
      ...prev,
      rowsPerPage: parseInt(event.target.value, 10),
      page: 0
    }));
  }, []);

  // Save user (create or update)
  const handleSaveUser = useCallback(async () => {
    try {
      setLoading(true);
      
      if (editMode && selectedUser) {
        // Update existing user
        const { confirmPassword, ...updateData } = formData;
        await userService.updateUser(selectedUser.id, updateData as Omit<User, 'id' | 'status' | 'joinDate' | 'lastLogin'>);
        showSnackbar('User updated successfully');
      } else {
        // Create new user
        const { confirmPassword, ...createData } = formData;
        if (!createData.password) {
          throw new Error('Password is required');
        }
        await userService.createUser(createData as Omit<User, 'id' | 'status' | 'joinDate' | 'lastLogin'> & { password: string });
        showSnackbar('User created successfully');
      }
      
      await fetchUsers();
      handleCloseDialog();
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || 'Failed to save user');
      showSnackbar(error.response?.data?.message || 'Failed to save user', 'error');
    } finally {
      setLoading(false);
    }
  }, [editMode, formData, selectedUser, fetchUsers, handleCloseDialog, showSnackbar]);

  // Delete user
  const handleDeleteUser = useCallback(async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      setLoading(true);
      await userService.deleteUser(userId);
      showSnackbar('User deleted successfully');
      await fetchUsers();
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || 'Failed to delete user');
      showSnackbar(error.response?.data?.message || 'Failed to delete user', 'error');
    } finally {
      setLoading(false);
    }
  }, [fetchUsers, showSnackbar]);

  // Toggle user status
  const handleStatusToggle = useCallback(async (userId: string, currentStatus: User['status']) => {
    try {
      setLoading(true);
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await userService.updateUser(userId, { status: newStatus });
      showSnackbar(`User ${newStatus}d successfully`);
      await fetchUsers();
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || 'Failed to update user status');
      showSnackbar(error.response?.data?.message || 'Failed to update user status', 'error');
    } finally {
      setLoading(false);
    }
  }, [fetchUsers, showSnackbar]);

  // Filter users based on search term and filters
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = searchTerm === '' || 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Fetch users when filters or pagination changes
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Show loading state
  if (loading && users.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Check admin permissions
  if (!isUserAdmin) {
    return (
      <Box p={3}>
        <Alert severity="error">You don't have permission to access this page.</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Users Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PersonAddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add User
        </Button>
      </Box>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 200, flexGrow: 1 }}
          />
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as string)}
              label="Role"
            >
              <MenuItem value="all">All Roles</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="guide">Guide</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as string)}
              label="Status"
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Users Table */}
      <UsersTable
        users={filteredUsers}
        loading={loading}
        pagination={{
          ...pagination,
          page: pagination.page,
          rowsPerPage: pagination.rowsPerPage,
          count: pagination.count
        }}
        currentUserId={currentUser?.id}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        onEdit={handleOpenDialog}
        onDelete={handleDeleteUser}
        onStatusToggle={handleStatusToggle}
        isAdmin={isUserAdmin || false}
      />

      {/* Add/Edit User Dialog */}
      <UserFormDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onSubmit={handleSaveUser}
        formData={formData}
        onInputChange={handleInputChange}
        onRoleChange={handleRoleChange}
        onStatusChange={handleStatusChange}
        loading={loading}
        editMode={editMode}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UsersManagement;
