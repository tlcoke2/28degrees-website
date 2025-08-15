// src/components/layout/UserMenu.tsx
import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/UserContext';
import {
  Avatar,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  Person as PersonIcon,
  Dashboard as DashboardIcon,
  ExitToApp as LogoutIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          component={RouterLink}
          to="/login"
          color="inherit"
          sx={{ textTransform: 'none' }}
        >
          Login
        </Button>
        <Button
          component={RouterLink}
          to="/register"
          variant="contained"
          color="primary"
          sx={{ textTransform: 'none' }}
        >
          Sign Up
        </Button>
      </Box>
    );
  }

  return (
    <div>
      <IconButton
        onClick={handleMenu}
        size="small"
        aria-label="account menu"
        aria-controls={open ? 'account-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
          {user?.name ? user.name.charAt(0).toUpperCase() : <PersonIcon />}
        </Avatar>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem
          component={RouterLink}
          to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
        >
          <ListItemIcon>
            <DashboardIcon fontSize="small" />
          </ListItemIcon>
          Dashboard
        </MenuItem>
        <MenuItem component={RouterLink} to="/profile">
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <Divider />
        <MenuItem component={RouterLink} to="/settings">
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </div>
  );
};

export default UserMenu;
