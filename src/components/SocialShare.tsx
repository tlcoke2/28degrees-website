import React from 'react';
import { 
  Box, 
  IconButton, 
  Tooltip, 
  Typography,
  Button,
  Popover,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Share as ShareIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  Link as LinkIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon
} from '@mui/icons-material';

type SocialShareProps = {
  url: string;
  title: string;
  description?: string;
  hashtags?: string[];
  size?: 'small' | 'medium' | 'large';
  variant?: 'icon' | 'button';
  color?: 'primary' | 'secondary' | 'inherit' | 'default';
};

const SocialShare: React.FC<SocialShareProps> = ({
  url,
  title,
  description = '',
  hashtags = ['28DegreesWest', 'JamaicaTravel'],
  size = 'medium',
  variant = 'icon',
  color = 'primary'
}) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
  const [copied, setCopied] = React.useState(false);
  
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch (err) {
      console.error('Failed to copy text: ', err);
      return false;
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setCopied(false);
  };

  const handleCopyLink = () => {
    copyToClipboard(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'social-share-popover' : undefined;

  const shareOptions = [
    {
      name: 'Copy Link',
      icon: <LinkIcon />,
      action: handleCopyLink,
      color: '#666666'
    },
    {
      name: 'Facebook',
      icon: <FacebookIcon />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(description)}`,
      color: '#1877F2'
    },
    {
      name: 'Twitter',
      icon: <TwitterIcon />,
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}&hashtags=${hashtags.join(',')}`,
      color: '#1DA1F2'
    },
    {
      name: 'WhatsApp',
      icon: <WhatsAppIcon />,
      url: `https://wa.me/?text=${encodeURIComponent(`${title} - ${url}`)}`,
      color: '#25D366'
    },
    {
      name: 'Email',
      icon: <EmailIcon />,
      url: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${description}\n\n${url}`)}`,
      color: '#EA4335'
    }
  ];

  return (
    <>
      {variant === 'icon' ? (
        <Tooltip title="Share">
          <IconButton
            aria-label="Share"
            onClick={handleClick}
            size={size}
            color={color === 'default' ? 'default' : color}
          >
            <ShareIcon />
          </IconButton>
        </Tooltip>
      ) : (
        <Button
          variant="outlined"
          startIcon={<ShareIcon />}
          onClick={handleClick}
          size={size}
          color={color === 'default' ? 'inherit' : color}
        >
          Share
        </Button>
      )}

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box p={2}>
          <Typography variant="subtitle1" gutterBottom>
            Share this {title ? 'tour' : 'page'}
          </Typography>
          <List dense>
            {shareOptions.map((option) => (
              <ListItem 
                button 
                key={option.name}
                onClick={() => {
                  if (option.action) {
                    option.action();
                  } else if (option.url) {
                    window.open(option.url, '_blank', 'noopener,noreferrer');
                  }
                  handleClose();
                }}
              >
                <ListItemIcon sx={{ color: option.color, minWidth: 40 }}>
                  {option.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={option.name} 
                  primaryTypographyProps={{
                    color: option.name === 'Copy Link' && copied ? 'primary' : 'textPrimary'
                  }}
                />
                {option.name === 'Copy Link' && copied && (
                  <Typography variant="caption" color="primary">
                    Copied!
                  </Typography>
                )}
              </ListItem>
            ))}
          </List>
        </Box>
      </Popover>
    </>
  );
};

export default SocialShare;
