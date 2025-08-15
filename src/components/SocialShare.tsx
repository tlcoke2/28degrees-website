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
  ListItemText,
} from '@mui/material';
import {
  Share as ShareIcon,
  Link as LinkIcon,
  WhatsApp as WhatsAppIcon,
  Instagram as InstagramIcon,
  MusicNote as TikTokIcon, // placeholder icon for TikTok
} from '@mui/icons-material';

type SocialShareProps = {
  url: string;
  title: string;
  description?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'icon' | 'button';
  color?: 'primary' | 'secondary' | 'inherit' | 'default';
};

const SocialShare: React.FC<SocialShareProps> = ({
  url,
  title,
  description = '',
  size = 'medium',
  variant = 'icon',
  color = 'primary',
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
  };

  const open = Boolean(anchorEl);
  const id = open ? 'social-share-popover' : undefined;

  // WhatsApp supports web share links; Instagram & TikTok do not (reliably) from web.
  // For IG and TikTok we copy the link so the user can paste in the app.
  const shareOptions: {
    name: string;
    icon: React.ReactNode;
    action?: () => void;
    url?: string;
    color?: string;
  }[] = [
    // Web Share API (if available) gives the native share sheet (includes IG/TikTok on mobile)
    ...(navigator.share
      ? [
          {
            name: 'Share…',
            icon: <ShareIcon />,
            action: async () => {
              try {
                await navigator.share({ title, text: description, url });
              } catch {
                // ignored if user cancels
              }
            },
            color: undefined,
          },
        ]
      : []),
    {
      name: 'WhatsApp',
      icon: <WhatsAppIcon />,
      url: `https://wa.me/?text=${encodeURIComponent(`${title} - ${url}`)}`,
      color: '#25D366',
    },
    {
      name: 'Instagram (copy link)',
      icon: <InstagramIcon />,
      action: handleCopyLink,
      color: '#E4405F',
    },
    {
      name: 'TikTok (copy link)',
      icon: <TikTokIcon />,
      action: handleCopyLink,
      color: '#000000',
    },
    {
      name: 'Copy Link',
      icon: <LinkIcon />,
      action: handleCopyLink,
      color: '#666666',
    },
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
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Box p={2}>
          <Typography variant="subtitle1" gutterBottom>
            Share this {title ? 'page' : 'item'}
          </Typography>
          <List dense>
            {shareOptions.map((option) => (
              <ListItem
                key={option.name}
                button
                onClick={() => {
                  if (option.action) {
                    option.action();
                  } else if (option.url) {
                    window.open(option.url, '_blank', 'noopener,noreferrer');
                  }
                  // keep popover open briefly if copying to show "Copied!" text
                  if (!option.action || option.name !== 'Copy Link') {
                    handleClose();
                  }
                }}
              >
                <ListItemIcon sx={{ color: option.color, minWidth: 40 }}>
                  {option.icon}
                </ListItemIcon>
                <ListItemText
                  primary={option.name}
                  primaryTypographyProps={{
                    color:
                      option.name.includes('Copy') && copied ? 'primary' : 'textPrimary',
                  }}
                />
                {option.name.includes('Copy') && copied && (
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
