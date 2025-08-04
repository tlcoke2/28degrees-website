import React, { useEffect, useState } from 'react';
import { Box, keyframes, styled } from '@mui/material';
// Logo is served from the public directory
const logo = '/assets/logo.png';

const slide = keyframes`
  0% { transform: translateX(100vw); }
  100% { transform: translateX(-100%); }
`;

const AnimatedBanner = styled(Box)({
  width: '100vw',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  backgroundColor: '#f5f5f5',
  padding: '10px 0',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  position: 'relative',
  left: '50%',
  right: '50%',
  marginLeft: '-50vw',
  marginRight: '-50vw',
  '&:hover': {
    '& .slide': {
      animationPlayState: 'paused',
    }
  },
});

const SlideContent = styled(Box)({
  display: 'inline-block',
  whiteSpace: 'nowrap',
  paddingLeft: '100%',
  animation: `${slide} 40s linear infinite`,
  '&:hover': {
    animationPlayState: 'paused',
  },
});

const Logo = styled('img')({
  height: '50px',
  width: 'auto',
  margin: '0 40px 0 0',
  verticalAlign: 'middle',
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'scale(1.1)',
  },
});

const BannerText = styled('span')({
  display: 'inline-flex',
  alignItems: 'center',
  fontSize: '1.1rem',
  fontWeight: 500,
  color: '#333',
  margin: '0 20px',
  verticalAlign: 'middle',
});

const SlidingBanner: React.FC = () => {
  const [items, setItems] = useState<Array<{ id: number; type: 'logo' | 'text'; content: string }>>([]);

  useEffect(() => {
    // Banner content - customize as needed
    const bannerItems = [
      { id: 1, type: 'logo' as const, content: logo },
      { id: 2, type: 'text' as const, content: '✨ Welcome to 28 Degrees West! ✨' },
      { id: 3, type: 'text' as const, content: '🎉 Special Offers Available! 🎉' },
      { id: 4, type: 'text' as const, content: '📞 Contact us for more information' },
    ];
    
    // Duplicate items to create seamless loop
    setItems([...bannerItems, ...bannerItems]);
  }, []);

  return (
    <AnimatedBanner>
      <SlideContent className="slide">
        {items.map((item) => (
          <React.Fragment key={item.id}>
            {item.type === 'logo' ? (
              <Logo src={item.content} alt="28 Degrees West Logo" />
            ) : (
              <BannerText>{item.content}</BannerText>
            )}
          </React.Fragment>
        ))}
      </SlideContent>
    </AnimatedBanner>
  );
};

export default SlidingBanner;
