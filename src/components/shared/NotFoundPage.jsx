import { Box, Typography, Button } from '@mui/material';
import { SearchOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        p: 3,
      }}
    >
      <SearchOff sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
      <Typography variant="h3" fontWeight={800} color="text.secondary" gutterBottom>
        404
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
        Page not found
      </Typography>
      <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
        The page you are looking for doesn't exist or has been moved.
      </Typography>
      <Button variant="contained" onClick={() => navigate('/dashboard', { replace: true })}>
        Go to Dashboard
      </Button>
    </Box>
  );
}
