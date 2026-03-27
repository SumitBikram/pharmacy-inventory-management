import { Chip } from '@mui/material';

const presets = {
  'in-stock': { label: 'In Stock', color: 'success' },
  'low-stock': { label: 'Low Stock', color: 'warning' },
  'out-of-stock': { label: 'Out of Stock', color: 'error' },
  expired: { label: 'Expired', color: 'error' },
  'expiring-soon': { label: 'Expiring Soon', color: 'warning' },
  active: { label: 'Active', color: 'success' },
  inactive: { label: 'Inactive', color: 'default' },
};

export default function StatusChip({ status, label, color, size = 'small' }) {
  const preset = presets[status] || {};
  return (
    <Chip
      label={label || preset.label || status}
      color={color || preset.color || 'default'}
      size={size}
      variant="outlined"
    />
  );
}
