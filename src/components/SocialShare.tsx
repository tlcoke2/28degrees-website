import React from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Typography,
  Button,
  Popover,
  List,
  ListItemIcon,
  ListItemText,
  ListItemButton,
} from '@mui/material';
import {
  Share as ShareIcon,
  Link as LinkIcon,
  WhatsApp as WhatsAppIcon,
  Instagram as InstagramIcon,
} from '@mui/icons-material';
import SvgIcon from '@mui/material/SvgIcon';

type SocialShareProps = {
  url: string;
  title: string;
  description?: string;
  hashtags?: string[];
  size?: 'small' | 'medium' | 'large';
  variant?: 'icon' | 'button';
  color?: 'primary' | 'secondary' | 'inherit' | 'default';
};

// Minimal TikTok logo as an inline SVG (Material doesn't ship a TikTok icon)
const TikTokIcon: React.FC<React.ComponentProps<typeof SvgIcon>> = (props) => (
  <SvgIcon {...props} viewBox="0 0 48 48">
    <path d="M31.3 8.2c2.2 2.4 4.9 4 8.3 4.3v6.1c-3.6-.1-6.7-1.2-8.9-3V30c0 6-4.9 10.9-10.9 10.9S8.9 36 8.9 30s4.9-10.9 10.9-10.9c.6 0 1.2.1 1.8.2v6.3c-.6-.3-1.2-.4-1.8-.4-2.8 0-5 2.2-5 4.9s2.2 4.9 5 4.9 4.9-2.2 4.9-4.9V6.9h6.7v1.3z" />
  </SvgIcon>
);

const SocialShare: React.FC<SocialShareProps> = ({
  url,
  title,
  description = '',
  hashtags = ['28DegreesWest', 'JamaicaTravel'],
  size = 'medium',
  variant = 'icon',
  color = 'primary',
}) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
  const [copied, setCopied] = React.useState(false);

  const open = Boolean(anchorEl);
  const id = open ? 'social-share-popover' : undefined;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const webShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description || title,
          url,
        });
      } catch (e) {
        // user canceled or unsupported action
      }
      return true;
    }
    return false;
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
    setCopied(false);
  };

  const shareOptions: Array<{
    name: string;
    icon: React.ReactNode;
    color: string;
    onClick: () => void | Promise<void>;
  }> = [
    {
      name: 'Copy Link',
      icon: <LinkIcon />,
      color: '#666666',
      onClick: () => copyToClipboard(url),
    },
    {
      name: 'WhatsApp',
      icon: <WhatsAppIcon />,
      color: '#25D366',
      onClick: () => {
        const link = `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`;
        window.open(link, '_blank', 'noopener,noreferrer');
      },
    },
    {
      name: 'Instagram',
      icon: <InstagramIcon />,
      color: '#E1306C',
      onClick: async () => {
        const shared = await webShare();
        if (!shared) {
          // Fallback: copy link and open Instagram for manual paste
          await copyToClipboard(url);
          window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
        }
      },
    },
    {
      name: 'TikTok',
      icon: <TikTokIcon />,
      color: '#000000',
      onClick: async () => {
        const shared = await webShare();
        if (!shared) {
          // Fallback: copy link and open TikTok for manual paste
          await copyToClipboard(url);
          window.open('https://www.tiktok.com/', '_blank', 'noopener,noreferrer');
        }
      },
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
        <Box p={2} sx={{ minWidth: 240 }}>
          <Typography variant="subtitle1" gutterBottom>
            Share this {title ? 'item' : 'page'}
          </Typography>
          <List dense>
            {shareOptions.map(({ name, icon, color, onClick }) => (
              <ListItemButton
                key={name}
                onClick={async () => {
                  await onClick();
                  handleClose();
                }}
              >
                <ListItemIcon sx={{ color, minWidth: 40 }}>{icon}</ListItemIcon>
                <ListItemText
                  primary={name}
                  primaryTypographyProps={{
                    color: name === 'Copy Link' && copied ? 'primary' : 'textPrimary',
                  }}
                />
                {name === 'Copy Link' && copied && (
                  <Typography variant="caption" color="primary">
                    Copied!
                  </Typography>
                )}
              </ListItemButton>
            ))}
          </List>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Tip: On mobile, the Share option may let you post directly to Instagram or TikTok.
          </Typography>
        </Box>
      </Popover>
    </>
  );
};

export default SocialShare;
