import { CircularProgress, Box, BoxProps } from '@mui/material';

interface LoadingSpinnerProps extends BoxProps {
  fullHeight?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ fullHeight = false, ...boxProps }) => (
  <Box 
    display="flex" 
    justifyContent="center" 
    alignItems="center" 
    minHeight={fullHeight ? '80vh' : '200px'}
    width="100%"
    {...boxProps}
  >
    <CircularProgress />
  </Box>
);

export default LoadingSpinner;
