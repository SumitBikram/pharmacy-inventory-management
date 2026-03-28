import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import { Visibility, VisibilityOff, LocationOn, WhatsApp } from '@mui/icons-material';
import { SiGmail, SiGithub, SiInstagram, SiX } from 'react-icons/si';
import { FaLinkedin } from 'react-icons/fa6';
import { Navigate, useNavigate } from 'react-router-dom';
import useAuthStore from './authStore';
import PharmacyBackground from '../../components/PharmacyBackground';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user, login, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  // If already logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const success = await login(email, password);
    setSubmitting(false);
    if (success) {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
        position: 'relative',
        p: 2,
      }}
    >
      <PharmacyBackground />
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        <Card sx={{ maxWidth: 420, width: '100%', boxShadow: 6 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Box
                component="img"
                src="/logo.png"
                alt="Che Health Care"
                sx={{ height: 64, mb: 1, display: 'block', mx: 'auto' }}
              />
              <Box sx={{ display: 'inline-block', textAlign: 'right' }}>
                <Typography variant="h5" fontWeight={700} color="primary">
                  Che Health Care
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mt: -0.5 }}
                >
                  চে হেলথ্ কেয়ার
                </Typography>
              </Box>
            </Box>

            {error && (
              <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                sx={{ mb: 3 }}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {submitting ? 'Signing in...' : 'Sign In'}
              </Button>
            </Box>

            <Box
              sx={{
                mt: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
              >
                <LocationOn fontSize="small" /> Ramnagar, Purba Medinipur
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
              >
                <WhatsApp fontSize="small" color="success" /> +91 8641887754
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
      <Box
        sx={{
          mt: 'auto',
          pb: 2,
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
          backgroundColor: 'background.default',
          borderRadius: 2,
          px: 3,
          py: 1.5,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Meet the Developer
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          {[
            {
              icon: <SiGmail size={16} />,
              href: 'mailto:dev.sumitbm@gmail.com',
              label: 'Email',
              hoverColor: '#EA4335',
            },
            {
              icon: <SiGithub size={16} />,
              href: 'https://github.com/SumitBikram',
              label: 'GitHub',
              hoverColor: '#181717',
            },
            {
              icon: <SiInstagram size={16} />,
              href: 'https://www.instagram.com/rony_sumit/',
              label: 'Instagram',
              hoverColor: '#E4405F',
            },
            {
              icon: <FaLinkedin size={16} />,
              href: 'https://www.linkedin.com/in/sumit-bikram-maity-225358102/',
              label: 'LinkedIn',
              hoverColor: '#0A66C2',
            },
            {
              icon: <SiX size={16} />,
              href: 'https://x.com/sumit_bikram',
              label: 'X',
              hoverColor: '#000',
            },
          ].map(({ icon, href, label, hoverColor }) => (
            <Tooltip key={label} title={label} arrow enterDelay={1000}>
              <IconButton
                component="a"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                aria-label={label}
                sx={{
                  color: 'text.secondary',
                  transition: 'color 0.2s',
                  p: 0.75,
                  '&:hover': { color: hoverColor },
                }}
              >
                {icon}
              </IconButton>
            </Tooltip>
          ))}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          © Copyright {new Date().getFullYear()}. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}
