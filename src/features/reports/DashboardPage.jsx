import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  LocalPharmacy,
  PointOfSale,
  NotificationsActive,
  Inventory,
  Receipt,
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
import PageHeader from '../../components/shared/PageHeader';
import { getDashboardStats, getMonthlySalesData } from './reportService';
import useRoleAccess from '../../hooks/useRoleAccess';

const allCards = [
  { key: 'totalMedicines', title: 'Total Medicines', icon: <LocalPharmacy />, color: '#1B5E20', format: (v) => v, visibleTo: ['admin', 'accountant'] },
  { key: 'todaySales', title: "Today's Sales", icon: <PointOfSale />, color: '#FF6F00', format: (v) => `\u20B9${v.toFixed(0)}`, visibleTo: ['admin', 'salesman'] },
  { key: 'todayBillCount', title: "Today's Bills", icon: <Receipt />, color: '#1565C0', format: (v) => v, visibleTo: ['admin', 'salesman'] },
  { key: 'lowStockCount', title: 'Low Stock Items', icon: <Inventory />, color: '#ED6C02', format: (v) => v, visibleTo: ['admin', 'accountant'] },
  { key: 'expiringSoonCount', title: 'Expiring Soon', icon: <NotificationsActive />, color: '#D32F2F', format: (v) => v, visibleTo: ['admin', 'accountant'] },
];

export default function DashboardPage() {
  const { role, isAdmin, isSalesman } = useRoleAccess();
  const [stats, setStats] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, monthly] = await Promise.all([
          getDashboardStats(),
          getMonthlySalesData(6),
        ]);
        setStats(statsData);
        setMonthlyData(monthly);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const visibleCards = allCards.filter((card) => card.visibleTo.includes(role));

  const greetings = {
    admin: 'Full overview of your pharmacy',
    accountant: 'Stock & inventory overview',
    salesman: 'Sales overview',
  };

  const showSalesChart = isAdmin || isSalesman;
  const showStockChart = isAdmin || !isSalesman;

  return (
    <Box>
      <PageHeader title="Dashboard" subtitle={greetings[role] || 'Overview'} />

      {/* Summary cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {visibleCards.map((card) => (
          <Grid size={{ xs: 6, sm: 4, md: 12 / Math.min(visibleCards.length, 5) }} key={card.key}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 2 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    backgroundColor: `${card.color}15`,
                    color: card.color,
                    display: 'flex',
                  }}
                >
                  {card.icon}
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {card.title}
                  </Typography>
                  <Typography variant="h6" fontWeight={700}>
                    {stats?.[card.key] != null ? card.format(stats[card.key]) : '—'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {showSalesChart && (
          <Grid size={{ xs: 12, md: showStockChart ? 7 : 12 }}>
            <Card sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Monthly Sales</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => `\u20B9${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                  <Tooltip formatter={(value) => [`\u20B9${value.toFixed(2)}`, 'Sales']} />
                  <Bar dataKey="total" fill="#1B5E20" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
        )}
        {showStockChart && (
          <Grid size={{ xs: 12, md: showSalesChart ? 5 : 12 }}>
            <Card sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Bills Per Month</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#FF6F00" strokeWidth={2} dot={{ r: 4 }} name="Bills" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
