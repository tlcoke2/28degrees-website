import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Avatar,
  Chip, MenuItem, Select, FormControl, InputLabel, Divider,
  CircularProgress, Snackbar, Alert, Switch, FormControlLabel, 
  Tooltip, TablePagination, InputAdornment
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2'; // Import the new Grid v2
import { 
  Search as SearchIcon, Person as PersonIcon, Email as EmailIcon, 
  Phone as PhoneIcon, AdminPanelSettings as AdminIcon, 
  Edit as EditIcon, Delete as DeleteIcon, PersonAdd as PersonAddIcon,
  CheckCircle as CheckCircleIcon, Cancel as CancelIcon,
  Refresh as RefreshIcon, Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon, Lock as LockIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { userService, User } from '../../services/api';
import { AxiosError } from 'axios';
import { format } from 'date-fns';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'user' | 'guide';
  status: 'active' | 'inactive' | 'suspended';
  avatar?: string;
  joinDate: string;
  lastLogin?: string;
}

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 0,
    rowsPerPage: 10,
    count: 0
  });
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' | 'info' | 'warning' 
  });

  // Show snackbar notification
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setEditMode(false);
  };
  const { isAdmin } = useAuth();

  // Load users from API
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isAdmin) return;
      
      try {
        setLoading(true);
        const data = await userService.getAllUsers();
        setUsers(data);
        setFilteredUsers(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users. Please try again later.');
        showSnackbar('Failed to load users', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isAdmin]);

  // Filter users based on search term, role, and status
  useEffect(() => {
    if (!users.length) return;
    
    let result = [...users];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(user => 
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        (user.phone && user.phone.includes(term))
      );
    }
    
    if (roleFilter !== 'all') {
      result = result.filter(user => user.role === roleFilter);
    }
    
    if (statusFilter !== 'all') {
      result = result.filter(user => user.status === statusFilter);
    }
    
    setFilteredUsers(result);
  }, [searchTerm, roleFilter, statusFilter, users]);

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setSelectedUser({ ...user });
      setEditMode(true);
    } else {
      setSelectedUser({
        id: '',
        name: '',
        email: '',
        phone: '',
        role: 'user',
        status: 'active',
        joinDate: new Date().toISOString()
      });
      setEditMode(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedUser) return;
    
    const { name, value } = e.target;
    setSelectedUser({
      ...selectedUser,
      [name]: value
    });
  };

  const handleRoleChange = (e: any) => {
    if (!selectedUser) return;
    
    setSelectedUser({
      ...selectedUser,
      role: e.target.value
    });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedUser) return;
    
    setSelectedUser({
      ...selectedUser,
      status: e.target.checked ? 'active' : 'inactive'
    });
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    
    try {
      if (editMode) {
        await userService.updateUser(selectedUser.id, selectedUser);
        const updatedUsers = users.map(user => 
          user.id === selectedUser.id ? selectedUser : user
        );
        setUsers(updatedUsers);
        showSnackbar('User updated successfully', 'success');
      } else {
        // In a real app, you would call an API to create a new user
        // For now, we'll just add it to the local state
        const newUser = {
          ...selectedUser,
          id: `user-${Date.now()}`,
          joinDate: new Date().toISOString()
        };
        setUsers([...users, newUser]);
        showSnackbar('User created successfully', 'success');
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving user:', error);
      showSnackbar('Failed to save user', 'error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await userService.deleteUser(userId);
        const updatedUsers = users.filter(user => user.id !== userId);
        setUsers(updatedUsers);
        showSnackbar('User deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting user:', error);
        showSnackbar('Failed to delete user', 'error');
      }
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'active':
        return <Chip icon={<CheckCircleIcon />} label="Active" color="success" size="small" />;
      case 'inactive':
        return <Chip icon={<CancelIcon />} label="Inactive" color="default" size="small" />;
      case 'suspended':
        return <Chip label="Suspended" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const getRoleChip = (role: string) => {
    switch (role) {
      case 'admin':
        return <Chip icon={<AdminIcon />} label="Admin" color="primary" size="small" />;
      case 'guide':
        return <Chip label="Tour Guide" color="secondary" size="small" />;
      default:
        return <Chip label="User" size="small" variant="outlined" />;
    }
  };

  if (!isAdmin) {
    return (
      <Box p={3}>
        <Typography variant="h6" color="error">
          You don't have permission to access this page.
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Users Management</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PersonAddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New User
        </Button>
      </Box>

      {/* Filters and Search */}
      <Box mb={3} display="flex" gap={2} flexWrap="wrap">
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
          }}
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
            <MenuItem value="guide">Tour Guide</MenuItem>
            <MenuItem value="user">User</MenuItem>
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

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Member Since</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar 
                          src={user.avatar} 
                          alt={user.name}
                          sx={{ width: 40, height: 40, mr: 2 }}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight="500">
                            {user.name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Box display="flex" alignItems="center" mb={0.5}>
                          <EmailIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            {user.email}
                          </Typography>
                        </Box>
                        {user.phone && (
                          <Box display="flex" alignItems="center">
                            <PhoneIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                            <Typography variant="body2">
                              {user.phone}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{getRoleChip(user.role)}</TableCell>
                    <TableCell>{getStatusChip(user.status)}</TableCell>
                    <TableCell>
                      {new Date(user.joinDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {user.lastLogin ? (
                        new Date(user.lastLogin).toLocaleString()
                      ) : (
                        'Never'
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit User">
                        <IconButton 
                          onClick={() => handleOpenDialog(user)}
                          color="primary"
                          size="small"
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete User">
                        <IconButton 
                          onClick={() => handleDeleteUser(user.id)}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="textSecondary" py={3}>
                      No users found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit User Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        {selectedUser && (
          <>
            <DialogTitle>{editMode ? 'Edit User' : 'Add New User'}</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Box display="flex" justifyContent="center" mb={2}>
                    <Avatar 
                      src={selectedUser.avatar} 
                      alt={selectedUser.name}
                      sx={{ width: 80, height: 80 }}
                    >
                      {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : <PersonIcon />}
                    </Avatar>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="name"
                    value={selectedUser.name}
                    onChange={handleInputChange}
                    margin="normal"
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={selectedUser.email}
                    onChange={handleInputChange}
                    margin="normal"
                    required
                    disabled={editMode}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    name="phone"
                    value={selectedUser.phone || ''}
                    onChange={handleInputChange}
                    margin="normal"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal" required>
                    <InputLabel>Role</InputLabel>
                    <Select
                      value={selectedUser.role}
                      onChange={handleRoleChange}
                      label="Role"
                    >
                      <MenuItem value="admin">Admin</MenuItem>
                      <MenuItem value="guide">Tour Guide</MenuItem>
                      <MenuItem value="user">User</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={selectedUser.status === 'active'}
                        onChange={handleStatusChange}
                        color="primary"
                      />
                    }
                    label={selectedUser.status === 'active' ? 'Active' : 'Inactive'}
                  />
                </Grid>
                
                {!editMode && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">
                      A temporary password will be generated and sent to the user's email.
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button 
                onClick={handleSaveUser} 
                variant="contained" 
                color="primary"
                disabled={!selectedUser.name || !selectedUser.email}
              >
                {editMode ? 'Update User' : 'Create User'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await userService.getAllUsers(
        pagination.page + 1, // API is 1-indexed, MUI is 0-indexed
        pagination.rowsPerPage,
        { 
          role: roleFilter === 'all' ? '' : roleFilter,
          status: statusFilter === 'all' ? '' : statusFilter,
          search: searchTerm
        }
      );
      
      setUsers(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.total,
        totalPages: response.totalPages
      }));
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      console.error('Error fetching users:', error);
      setError(error.response?.data?.message || 'Failed to load users. Please try again.');
      showSnackbar(error.response?.data?.message || 'Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle pagination
  const handleChangePage = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setPagination(prev => ({
      ...prev,
      page: newPage,
    }));
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPagination(prev => ({
      ...prev,
      page: 0, // Reset to first page
      rowsPerPage: parseInt(event.target.value, 10)
    }));
  };

  // Refresh users list
  const handleRefresh = () => {
    fetchUsers();
  };

  // Handle search with debounce
  useEffect(() => {
    const timerId = setTimeout(() => {
      if (searchTerm || searchTerm === '') {
        fetchUsers();
      }
    }, 500);

    return () => clearTimeout(timerId);
  }, [searchTerm, roleFilter, statusFilter]);

  // Initial data load
  useEffect(() => {
    fetchUsers();
  }, [pagination.page, pagination.rowsPerPage]);

  // Handle user save (create/update)
  const handleSaveUser = async () => {
    if (!selectedUser) return;
    
    try {
      setLoading(true);
      
      if (editMode) {
        // Update existing user
        const updatedUser = await userService.updateUser(selectedUser.id, {
          name: selectedUser.name,
          email: selectedUser.email,
          phone: selectedUser.phone || '',
          role: selectedUser.role
        });
        
        // Update local state
        const updatedUsers = users.map(user => 
          user.id === updatedUser.id ? updatedUser : user
        );
        
        setUsers(updatedUsers);
        showSnackbar('User updated successfully', 'success');
      } else {
        // Create new user
        const newUser = await userService.createUser({
          name: selectedUser.name,
          email: selectedUser.email,
          phone: selectedUser.phone || '',
          role: selectedUser.role,
          password: 'TemporaryPassword123!' // In a real app, generate a secure random password
        });
        
        // Add to local state
        setUsers([newUser, ...users]);
        showSnackbar('User created successfully', 'success');
      }
      
      handleCloseDialog();
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      console.error('Error saving user:', error);
      showSnackbar(error.response?.data?.message || 'Failed to save user', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        setLoading(true);
        await userService.deleteUser(userId);
        
        // Update local state
        const updatedUsers = users.filter(user => user.id !== userId);
        setUsers(updatedUsers);
        showSnackbar('User deleted successfully', 'success');
      } catch (err) {
        const error = err as AxiosError<{ message?: string }>;
        console.error('Error deleting user:', error);
        showSnackbar(error.response?.data?.message || 'Failed to delete user', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle status toggle
  const handleStatusToggle = async (userId: string, currentStatus: User['status']) => {
    try {
      setLoading(true);
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await userService.updateUserStatus(userId, newStatus);
      
      // Update local state
      const updatedUsers = users.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      );
      
      setUsers(updatedUsers);
      showSnackbar(`User ${newStatus} successfully`, 'success');
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      console.error('Error updating user status:', error);
      showSnackbar(error.response?.data?.message || 'Failed to update user status', 'error');
    } finally {
      setLoading(false);
    }
  };

export default UsersManagement;
