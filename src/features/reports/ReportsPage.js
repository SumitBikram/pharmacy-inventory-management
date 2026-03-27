import { useState } from 'react';
import { Box, Tab } from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import PageHeader from '../../components/shared/PageHeader';
import SalesReport from './SalesReport';
import StockReport from './StockReport';
import ExpiryReport from './ExpiryReport';

export default function ReportsPage() {
  const [tab, setTab] = useState('sales');

  return (
    <Box>
      <PageHeader title="Reports" subtitle="Sales, stock, and expiry reports" />

      <TabContext value={tab}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <TabList onChange={(_, v) => setTab(v)}>
            <Tab label="Daily Sales" value="sales" />
            <Tab label="Stock Report" value="stock" />
            <Tab label="Expiry Report" value="expiry" />
          </TabList>
        </Box>

        <TabPanel value="sales" sx={{ p: 0 }}>
          <SalesReport />
        </TabPanel>
        <TabPanel value="stock" sx={{ p: 0 }}>
          <StockReport />
        </TabPanel>
        <TabPanel value="expiry" sx={{ p: 0 }}>
          <ExpiryReport />
        </TabPanel>
      </TabContext>
    </Box>
  );
}
