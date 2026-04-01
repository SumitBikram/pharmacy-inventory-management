import { differenceInDays } from 'date-fns';

export function getExpiryStatus(expiryDate) {
  const days = differenceInDays(new Date(expiryDate), new Date());
  if (days < 0) return { label: 'Expired', color: 'error' };
  if (days <= 90) return { label: 'Expiring Soon', color: 'warning' };
  return { label: 'OK', color: 'success' };
}

export function formatMedicineName(name, packing, unit) {
  if (!name) return '—';
  if (!packing) return name;
  return `${name} (${packing}${unit ? ' ' + unit : ''})`;
}
