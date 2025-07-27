import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import {
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  YouTube as YouTubeIcon,
  Pinterest as PinterestIcon
} from '@mui/icons-material';

type SocialMediaLinksProps = {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'inherit' | 'default';
  spacing?: number;
};

const SocialMediaLinks: React.FC<SocialMediaLinksProps> = ({
  size = 'medium',
  color = 'primary',
  spacing = 2
}) => {
  const socialLinks = [
    {
      name: 'Facebook',
      icon: <FacebookIcon fontSize={size} />,
      url: 'https://www.facebook.com/28degreeswest',
      color: '#1877F2'
    },
    {
      name: 'Instagram',
      icon: <InstagramIcon fontSize={size} />,
      url: 'https://www.instagram.com/28degreeswest',
      color: '#E4405F'
    },
    {
      name: 'Twitter',
      icon: <TwitterIcon fontSize={size} />,
      url: 'https://twitter.com/28degreeswest',
      color: '#1DA1F2'
    },
    {
      name: 'YouTube',
      icon: <YouTubeIcon fontSize={size} />,
      url: 'https://www.youtube.com/@28degreeswest',
      color: '#FF0000'
    },
    {
      name: 'Pinterest',
      icon: <PinterestIcon fontSize={size} />,
      url: 'https://www.pinterest.com/28degreeswest',
      color: '#BD081C'
    }
  ];

  return (
    <Box display="flex" gap={spacing}>
      {socialLinks.map((social) => (
        <Tooltip key={social.name} title={social.name} arrow>
          <IconButton
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Visit our ${social.name} page`}
            sx={{
              color: color === 'default' ? social.color : undefined,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            {social.icon}
          </IconButton>
        </Tooltip>
      ))}
    </Box>
  );
};

export default SocialMediaLinks;
