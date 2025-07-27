import React from 'react';
import {
  Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Chip, Switch,
  FormControlLabel, Typography, TablePagination, Box, Avatar
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { User } from '../../../services/api';

// Extend the User type to ensure it has an id property
type TableUser = User & { id: string };

interface UsersTableProps {
  users: TableUser[];
  loading: boolean;
  pagination: {
    page: number;
    rowsPerPage: number;
    count: number;
  };
  currentUserId?: string;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onEdit: (user: TableUser) => void;
  onDelete: (userId: string) => void;
  onStatusToggle: (userId: string, currentStatus: User['status']) => void;
  isAdmin: boolean;
}

export const UsersTable: React.FC<UsersTableProps> = ({
  users,
  loading,
  pagination,
  currentUserId,
  onPageChange,
  onRowsPerPageChange,
  onEdit,
  onDelete,
  onStatusToggle,
  isAdmin
}) => (
  <Paper sx={{ width: '100%', overflow: 'hidden' }}>
    <TableContainer>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>User</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                <Typography color="textSecondary">
                  {loading ? 'Loading users...' : 'No users found'}
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Avatar
                      src={user.avatar}
                      sx={{ width: 32, height: 32, mr: 1 }}
                    >
                      {user.name?.[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body2">
                        {user.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {user.phone}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    label={user.role}
                    color={user.role === 'admin' ? 'primary' : 'default'}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={user.status === 'active'}
                        onChange={() => onStatusToggle(user.id, user.status)}
                        color="primary"
                        disabled={!isAdmin || user.id === currentUserId}
                      />
                    }
                    label={
                      <Typography variant="body2">
                        {user.status === 'active' ? 'Active' : 'Inactive'}
                      </Typography>
                    }
                  />
                </TableCell>
                <TableCell align="right">
                  <Box display="flex" gap={1} justifyContent="flex-end">
                    <IconButton
                      size="small"
                      onClick={() => onEdit(user)}
                      disabled={!isAdmin}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => onDelete(user.id)}
                      disabled={!isAdmin || user.id === currentUserId}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
    
    <TablePagination
      rowsPerPageOptions={[5, 10, 25]}
      component="div"
      count={pagination.count}
      rowsPerPage={pagination.rowsPerPage}
      page={pagination.page}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
    />
  </Paper>
);
