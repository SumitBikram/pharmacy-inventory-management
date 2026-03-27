import { Box, Typography } from '@mui/material';
import { InboxOutlined } from '@mui/icons-material';

export default function EmptyState({ message = 'No data found', icon, action }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 6,
        color: 'text.secondary',
      }}
    >
      {icon || <InboxOutlined sx={{ fontSize: 64, mb: 1, opacity: 0.4 }} />}
      <Typography variant="body1" sx={{ mb: 2 }}>
        {message}
      </Typography>
      {action}
    </Box>
  );
}
