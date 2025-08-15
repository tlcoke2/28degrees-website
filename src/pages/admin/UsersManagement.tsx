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
  joinDate: new Date().toISOString(),
};

const UsersManagement: React.FC = () => {
  const { user: currentUser, isAdmin } = useAuth();

  // State management
  const [users, setUsers] = useState<User[]>([]); // visible page slice
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);

  const [pagination, setPagination] = useState<{ page: number; rowsPerPage: number; count: number }>({
    page: 0,
    rowsPerPage: 10,
    count: 0,
  });

  const [formData, setFormData] = useState<UserFormDialogData>(defaultFormData);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const showSnackbar = useCallback(
    (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
      setSnackbar({ open: true, message, severity });
    },
    []
  );

  // Fetch users (client-side pagination to match userService signature)
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // your userService.getAllUsers accepts 0–1 arguments and returns User[]
      const all = await userService.getAllUsers();

      // Ensure each user has an id (fallback to _id)
      const allWithId: User[] = (all || []).map((u: any) => ({
        ...u,
        id: u.id || u._id || '',
      }));

      const start = pagination.page * pagination.rowsPerPage;
      const end = start + pagination.rowsPerPage;

      setUsers(allWithId.slice(start, end));
      setPagination((prev) => ({ ...prev, count: allWithId.length }));
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      const msg = ax.response?.data?.message || 'Failed to fetch users';
      setError(msg);
      showSnackbar(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.rowsPerPage, showSnackbar]);

  // Create / Update user
  const handleSaveUser = async (fd: UserFormDialogData) => {
    try {
      setLoading(true);

      if (editMode && selectedUser) {
        // Update existing
        const { password, confirmPassword, firstName, lastName, ...rest } = fd;
        const updateData: Partial<ApiUser> = {
          ...rest,
          name: `${firstName} ${lastName}`.trim(),
        };
        await userService.updateUser(selectedUser.id, updateData);
        showSnackbar('User updated successfully');
      } else {
        // Create new (password required)
        if (!fd.password) throw new Error('Password is required for new users');
        const { confirmPassword, firstName, lastName, ...rest } = fd;
        await userService.createUser({
          ...rest,
          name: `${firstName} ${lastName}`.trim(),
          password: fd.password,
        });
        showSnackbar('User created successfully');
      }

      setOpenDialog(false);
      await fetchUsers();
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      showSnackbar(ax.response?.data?.message || 'Failed to save user', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Toggle status (active <-> inactive) via updateUser (no updateUserStatus in userService)
  const handleStatusToggle = async (userId: string, currentStatus: User['status']) => {
    try {
      setLoading(true);
      const newStatus: User['status'] = currentStatus === 'active' ? 'inactive' : 'active';

      await userService.updateUser(userId, { status: newStatus } as Partial<ApiUser>);

      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)));
      showSnackbar(`User status updated to ${newStatus}`);
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      showSnackbar(ax.response?.data?.message || 'Failed to update user status', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Delete user (prevent self-delete)
  const handleDeleteUser = async (userId: string) => {
    try {
      const selfId = (currentUser as any)?.id || (currentUser as any)?.uid;
      if (selfId && userId === selfId) {
        showSnackbar("You can't delete your own account while logged in.", 'warning');
        return;
      }

      setLoading(true);
      await userService.deleteUser(userId);
      showSnackbar('User deleted successfully');
      await fetchUsers();
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      showSnackbar(ax.response?.data?.message || 'Failed to delete user', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Pagination handlers
  const handlePageChange = (_event: unknown, newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rows = parseInt(event.target.value, 10);
    setPagination((prev) => ({ ...prev, rowsPerPage: rows, page: 0 }));
  };

  // When editing, hydrate the form from the selected user
  useEffect(() => {
    if (editMode && selectedUser) {
      const nameParts = selectedUser.name ? selectedUser.name.split(' ') : ['', ''];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      setFormData({
        firstName,
        lastName,
        email: selectedUser.email || '',
        phone: (selectedUser as any).phone || '',
        role: selectedUser.role || 'user',
        status: (selectedUser.status as any) || 'active',
        joinDate: (selectedUser as any).joinDate || new Date().toISOString(),
        password: '',
        confirmPassword: '',
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [editMode, selectedUser]);

  // Kick off initial fetch and whenever page/rows change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handlers to open dialog in edit mode
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditMode(true);
    setOpenDialog(true);
  };

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
        currentUserId={(currentUser as any)?.id || (currentUser as any)?.uid || ''}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
        onStatusToggle={handleStatusToggle}
        isAdmin={!!isAdmin}
      />

      <UserFormDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onSubmit={handleSaveUser}
        formData={formData}
        loading={loading}
        editMode={editMode}
        onInputChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
          const { name, value } = e.target;
          setFormData((prev) => ({ ...prev, [name]: value }));
        }}
        onRoleChange={(e: any) => {
          setFormData((prev) => ({
            ...prev,
            role: (e.target?.value || 'user') as 'user' | 'admin' | 'guide',
          }));
        }}
        onStatusChange={(e: any) => {
          setFormData((prev) => ({
            ...prev,
            status: (e.target?.value || 'active') as 'active' | 'inactive' | 'suspended',
          }));
        }}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default UsersManagement;

