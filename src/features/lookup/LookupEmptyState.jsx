import { useState, useEffect, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@emotion/react';
import {
  ManageSearch,
  SearchOutlined,
  MedicationOutlined,
  ScienceOutlined,
  InventoryOutlined,
  LocalPharmacyOutlined,
  EventNoteOutlined,
  TipsAndUpdatesOutlined,
} from '@mui/icons-material';

const TIPS = [
  {
    icon: ManageSearch,
    message: 'Search for a medicine',
    hint: 'Type at least 3 characters to find medicines, check stock levels, and view batch details',
  },
  {
    icon: SearchOutlined,
    message: 'Did you know?',
    hint: 'You can search by generic name too — try typing the salt name instead of the brand',
  },
  {
    icon: MedicationOutlined,
    message: 'Pro tip: Check before you dispense',
    hint: 'Always verify the expiry date and batch number before handing medicines to a customer',
  },
  {
    icon: InventoryOutlined,
    message: 'Tip: Follow FIFO',
    hint: 'The green "Sell First" badge highlights the earliest-expiry batch — dispense that one first',
  },
  {
    icon: LocalPharmacyOutlined,
    message: 'Quick stock check',
    hint: 'Search any medicine to instantly see total available stock across all batches',
  },
  {
    icon: EventNoteOutlined,
    message: 'Watch for expiry alerts',
    hint: 'Batches expiring within 90 days are flagged — plan returns early',
  },
  {
    icon: ScienceOutlined,
    message: 'Compare batches easily',
    hint: 'Each batch shows its supplier, price, and remaining quantity side by side',
  },
  {
    icon: TipsAndUpdatesOutlined,
    message: 'Keep your inventory accurate',
    hint: 'Regular lookups help catch discrepancies between physical stock and system records',
  },
];

const gentleFloat = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
`;

const slideInFromRight = keyframes`
  from { opacity: 0; transform: translateX(60px); }
  to { opacity: 1; transform: translateX(0); }
`;

const slideOutToLeft = keyframes`
  from { opacity: 1; transform: translateX(0); }
  to { opacity: 0; transform: translateX(-60px); }
`;

const reducedMotion = {
  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
};

const INTERVAL = 5000;
const SLIDE_DURATION = 700;

export default function LookupEmptyState() {
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * TIPS.length));
  const [phase, setPhase] = useState('in'); // 'in' | 'out'

  const pickNextIndex = useCallback(() => {
    setTipIndex((prev) => {
      let next;
      do {
        next = Math.floor(Math.random() * TIPS.length);
      } while (next === prev && TIPS.length > 1);
      return next;
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      // Start slide-out
      setPhase('out');
      // After slide-out completes, swap tip and slide-in
      setTimeout(() => {
        pickNextIndex();
        setPhase('in');
      }, SLIDE_DURATION);
    }, INTERVAL);

    return () => clearInterval(timer);
  }, [pickNextIndex]);

  const { icon: IconComponent, message, hint } = TIPS[tipIndex];

  const slideAnimation =
    phase === 'in'
      ? `${slideInFromRight} ${SLIDE_DURATION}ms ease-out both`
      : `${slideOutToLeft} ${SLIDE_DURATION}ms ease-in both`;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'text.secondary',
        overflow: 'hidden',
      }}
    >
      <Box
        key={`${tipIndex}-${phase}`}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: slideAnimation,
          ...reducedMotion,
        }}
      >
        <IconComponent
          sx={{
            fontSize: 80,
            mb: 2,
            opacity: 0.3,
            animation: `${gentleFloat} 3s ease-in-out infinite`,
            ...reducedMotion,
          }}
        />
        <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
          {message}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 360, textAlign: 'center' }}
        >
          {hint}
        </Typography>
      </Box>
    </Box>
  );
}
