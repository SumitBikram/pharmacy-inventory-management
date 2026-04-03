import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  Typography,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  Stack,
  Chip,
} from '@mui/material';
import {
  LocalPharmacy,
  PointOfSale,
  NotificationsActive,
  Inventory,
  Receipt,
  CheckCircleOutline,
  ErrorOutline,
  WarningAmberRounded,
  Schedule,
  RemoveShoppingCart,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { subDays, subMonths, differenceInDays, format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats, getChartData, getDashboardAlerts } from './reportService';
import useRoleAccess from '../../hooks/useRoleAccess';

const axisStyle = { fontFamily: '"Nunito", sans-serif', fontSize: 12, fill: '#666' };

const PRESETS = [
  { key: '7D', label: '7D' },
  { key: '30D', label: '30D' },
  { key: '6M', label: '6M' },
  { key: '1Y', label: '1Y' },
  { key: 'custom', label: 'Custom' },
];

function resolveRange(range, customStart, customEnd) {
  const now = new Date();
  switch (range) {
    case '7D':
      return { granularity: 'day', startDate: subDays(now, 6), endDate: now };
    case '30D':
      return { granularity: 'day', startDate: subDays(now, 29), endDate: now };
    case '6M':
      return { granularity: 'month', startDate: subMonths(now, 5), endDate: now };
    case '1Y':
      return { granularity: 'month', startDate: subMonths(now, 11), endDate: now };
    case 'custom': {
      if (!customStart || !customEnd) return null;
      let start = new Date(customStart);
      let end = new Date(customEnd);
      if (end < start) [start, end] = [end, start];
      const days = differenceInDays(end, start);
      let granularity = 'day';
      if (days > 180) granularity = 'month';
      else if (days > 31) granularity = 'week';
      return { granularity, startDate: start, endDate: end };
    }
    default:
      return { granularity: 'month', startDate: subMonths(now, 5), endDate: now };
  }
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        p: 1.5,
        borderRadius: 2,
        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
        fontFamily: '"Nunito", sans-serif',
        minWidth: 120,
      }}
    >
      <Typography variant="caption" color="text.secondary" fontWeight={600}>
        {label}
      </Typography>
      {payload.map((entry, i) => (
        <Typography key={i} variant="body2" fontWeight={700} sx={{ color: entry.color }}>
          {entry.name}: {entry.name === 'Sales' ? `\u20B9${entry.value.toFixed(2)}` : entry.value}
        </Typography>
      ))}
    </Box>
  );
}

const MAX_ALERTS = 15;

function buildAlertMessages(alerts) {
  const messages = [];

  // Expired medicines (highest priority)
  alerts.expired?.forEach((item) => {
    messages.push({
      icon: <ErrorOutline fontSize="small" />,
      color: '#D32F2F',
      name: item.medicine?.name || 'Unknown',
      detail: `expired (batch: ${item.batch_no})`,
    });
  });

  // Out of stock
  alerts.lowStock
    ?.filter((m) => m.total_stock === 0)
    .forEach((item) => {
      messages.push({
        icon: <RemoveShoppingCart fontSize="small" />,
        color: '#B71C1C',
        name: item.medicine_name,
        detail: 'out of stock',
      });
    });

  // Low stock
  alerts.lowStock
    ?.filter((m) => m.total_stock > 0)
    .forEach((item) => {
      messages.push({
        icon: <WarningAmberRounded fontSize="small" />,
        color: '#ED6C02',
        name: item.medicine_name,
        detail: `${item.total_stock} left`,
      });
    });

  // Expiring soon
  alerts.expiringSoon?.forEach((item) => {
    messages.push({
      icon: <Schedule fontSize="small" />,
      color: '#F57C00',
      name: item.medicine_name,
      detail: `expires ${format(new Date(item.expiry_date), 'dd MMM yyyy')}`,
    });
  });

  return messages;
}

const statItems = [
  {
    key: 'totalMedicines',
    title: 'Total Medicines',
    icon: <LocalPharmacy fontSize="inherit" />,
    color: '#1B5E20',
    format: (v) => v,
    visibleTo: ['admin', 'accountant'],
  },
  {
    key: 'todaySales',
    title: "Today's Sales",
    icon: <PointOfSale fontSize="inherit" />,
    color: '#FF6F00',
    format: (v) => `\u20B9${v.toFixed(0)}`,
    visibleTo: ['admin', 'salesman'],
  },
  {
    key: 'todayBillCount',
    title: "Today's Bills",
    icon: <Receipt fontSize="inherit" />,
    color: '#1565C0',
    format: (v) => v,
    visibleTo: ['admin', 'salesman'],
  },
  {
    key: 'lowStockCount',
    title: 'Low Stock Items',
    icon: <Inventory fontSize="inherit" />,
    color: '#ED6C02',
    format: (v) => v,
    visibleTo: ['admin', 'accountant'],
  },
  {
    key: 'expiringSoonCount',
    title: 'Expiring Soon',
    icon: <NotificationsActive fontSize="inherit" />,
    color: '#D32F2F',
    format: (v) => v,
    visibleTo: ['admin', 'accountant'],
  },
];

export default function DashboardPage() {
  const { role, isAdmin, isSalesman } = useRoleAccess();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState({ lowStock: [], expiringSoon: [], expired: [] });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [range, setRange] = useState('7D');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  useEffect(() => {
    Promise.all([getDashboardStats(), getDashboardAlerts()])
      .then(([statsData, alertsData]) => {
        setStats(statsData);
        setAlerts(alertsData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const resolved = resolveRange(range, customStart, customEnd);
    if (!resolved) return;

    setChartLoading(true);
    getChartData(resolved.granularity, resolved.startDate, resolved.endDate)
      .then(setChartData)
      .catch(() => {})
      .finally(() => setChartLoading(false));
  }, [range, customStart, customEnd]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const visibleStats = statItems.filter((s) => s.visibleTo.includes(role));
  const showSalesChart = isAdmin || isSalesman;
  const showStockChart = isAdmin || !isSalesman;
  const showAlerts = isAdmin || !isSalesman;
  const isDailyGranularity =
    ['7D', '30D'].includes(range) ||
    (range === 'custom' &&
      customStart &&
      customEnd &&
      differenceInDays(new Date(customEnd), new Date(customStart)) <= 31);

  const alertMessages = buildAlertMessages(alerts);
  const totalAlertCount = alertMessages.length;
  const displayedAlerts = alertMessages.slice(0, MAX_ALERTS);

  const greetings = {
    admin: 'Full overview of your pharmacy',
    accountant: 'Stock & inventory overview',
    salesman: 'Sales overview',
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography variant="h5">Dashboard</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {greetings[role] || 'Overview'}
          </Typography>
        </Box>
        {(showSalesChart || showStockChart) && (
          <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1.5}>
            <ToggleButtonGroup
              value={range}
              exclusive
              size="small"
              onChange={(_, val) => val && setRange(val)}
              sx={{
                '& .MuiToggleButton-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 1.5,
                  fontFamily: '"Nunito", sans-serif',
                },
                '& .Mui-selected': {
                  bgcolor: '#03A6A1 !important',
                  color: '#fff !important',
                },
              }}
            >
              {PRESETS.map((p) => (
                <ToggleButton key={p.key} value={p.key}>
                  {p.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            {range === 'custom' && (
              <>
                <TextField
                  size="small"
                  type="date"
                  label="From"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ width: 160 }}
                />
                <TextField
                  size="small"
                  type="date"
                  label="To"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  slotProps={{
                    inputLabel: { shrink: true },
                    htmlInput: { max: format(new Date(), 'yyyy-MM-dd') },
                  }}
                  sx={{ width: 160 }}
                />
              </>
            )}
          </Stack>
        )}
      </Box>

      <Grid container spacing={2}>
        {/* Row 1: Overview + Alerts */}
        <Grid size={{ xs: 12, md: showAlerts ? 6 : 12 }}>
          <Card sx={{ px: 2, py: 1.5, borderTop: '3px solid #03A6A1', height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
              Overview
            </Typography>
            {visibleStats.map((item) => (
              <Box
                key={item.key}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  py: 0.5,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'text.secondary' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color, bgcolor: `${item.color}15`, borderRadius: '50%', p: 0.6, fontSize: 'inherit' }}>{item.icon}</Box>
                  <Typography variant="body2" color="text.secondary">
                    {item.title}
                  </Typography>
                </Box>
                <Typography variant="body1" fontWeight={700}>
                  {stats?.[item.key] != null ? item.format(stats[item.key]) : '\u2014'}
                </Typography>
              </Box>
            ))}
          </Card>
        </Grid>

        {showAlerts && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ px: 2, py: 1.5, borderTop: '3px solid #D32F2F', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Alerts
                </Typography>
                {totalAlertCount > 0 && (
                  <Chip label={totalAlertCount} size="small" color="error" />
                )}
              </Box>

              {totalAlertCount === 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexGrow: 1,
                    py: 2,
                    color: 'success.main',
                  }}
                >
                  <CheckCircleOutline sx={{ fontSize: 36, mb: 0.5 }} />
                  <Typography variant="body2" fontWeight={600}>
                    All clear!
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    No alerts at the moment
                  </Typography>
                </Box>
              ) : (
                <Box sx={{
                  flexGrow: 1,
                  overflowY: 'auto',
                  maxHeight: 160,
                  pr: 1.5,
                  '&::-webkit-scrollbar': { width: 4 },
                  '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 2 },
                }}>
                  {displayedAlerts.map((alert, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.75,
                        py: 0.5,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: alert.color, bgcolor: `${alert.color}15`, borderRadius: '50%', p: 0.5, flexShrink: 0, fontSize: 14 }}>{alert.icon}</Box>
                      <Typography variant="body2" noWrap sx={{ flexGrow: 1, minWidth: 0 }}>
                        {alert.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ flexShrink: 0 }}>
                        {alert.detail}
                      </Typography>
                    </Box>
                  ))}
                  {totalAlertCount > MAX_ALERTS && (
                    <Typography
                      variant="body2"
                      color="primary"
                      sx={{ mt: 1, cursor: 'pointer', fontWeight: 600, textAlign: 'center' }}
                      onClick={() => navigate('/alerts')}
                    >
                      View all {totalAlertCount} alerts
                    </Typography>
                  )}
                </Box>
              )}
            </Card>
          </Grid>
        )}



        {/* Row 2: Charts */}
        {showSalesChart && (
          <Grid size={{ xs: 12, md: showStockChart ? 6 : 12 }}>
            <Card sx={{ p: 2, borderTop: '3px solid #03A6A1', position: 'relative' }}>
              <Typography variant="h6" gutterBottom>
                Sales
              </Typography>
              {chartLoading && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1,
                  }}
                >
                  <CircularProgress size={32} />
                </Box>
              )}
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData} style={{ opacity: chartLoading ? 0.4 : 1 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#03A6A1" stopOpacity={1} />
                      <stop offset="100%" stopColor="#03A6A1" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#E0E0E0"
                    strokeOpacity={0.6}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={axisStyle}
                    axisLine={false}
                    tickLine={false}
                    {...(isDailyGranularity && { angle: -45, textAnchor: 'end', height: 60 })}
                  />
                  <YAxis
                    tick={axisStyle}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      `\u20B9${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                    }
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    formatter={(value) => [`\u20B9${value.toFixed(2)}`, 'Sales']}
                  />
                  <Bar
                    dataKey="total"
                    fill="url(#barGradient)"
                    radius={[6, 6, 0, 0]}
                    name="Sales"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
        )}
        {showStockChart && (
          <Grid size={{ xs: 12, md: showSalesChart ? 6 : 12 }}>
            <Card sx={{ p: 2, borderTop: '3px solid #C4A06E', position: 'relative' }}>
              <Typography variant="h6" gutterBottom>
                Bills
              </Typography>
              {chartLoading && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1,
                  }}
                >
                  <CircularProgress size={32} />
                </Box>
              )}
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData} style={{ opacity: chartLoading ? 0.4 : 1 }}>
                  <defs>
                    <linearGradient id="lineAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C4A06E" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#C4A06E" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#E0E0E0"
                    strokeOpacity={0.6}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={axisStyle}
                    axisLine={false}
                    tickLine={false}
                    {...(isDailyGranularity && { angle: -45, textAnchor: 'end', height: 60 })}
                  />
                  <YAxis
                    tick={axisStyle}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#C4A06E"
                    strokeWidth={2.5}
                    dot={{ r: 5, fill: '#C4A06E', stroke: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 7, fill: '#C4A06E', stroke: '#fff', strokeWidth: 2 }}
                    name="Bills"
                    fill="url(#lineAreaGradient)"
                    fillOpacity={1}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
