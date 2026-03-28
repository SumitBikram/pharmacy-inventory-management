import { useMemo } from 'react';
import { Box } from '@mui/material';
import pharmacyIcons from '../assets/icons/pharmacy';

// Pre-defined rotations to give variety without randomness looking clumpy
const ROTATIONS = [
  0, 15, -20, 45, -10, 30, -35, 60, -45, 20, -15, 50, 10, -25, 40, -5, 25, -40, 35, -30, 55, -50,
];

export default function PharmacyBackground() {
  const icons = useMemo(() => {
    const cols = 10;
    const rows = 8;
    const cellW = 100 / cols;
    const cellH = 100 / rows;
    const items = [];
    let iconIdx = 0;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Offset every other row for a staggered look
        const offsetX = row % 2 === 0 ? 0 : cellW / 2;
        // Small jitter within each cell to avoid a rigid grid
        const jitterX = (((iconIdx * 7 + 3) % 11) - 5) * 0.8;
        const jitterY = (((iconIdx * 13 + 5) % 11) - 5) * 0.8;

        items.push({
          src: pharmacyIcons[iconIdx % pharmacyIcons.length],
          x: col * cellW + cellW / 2 + offsetX + jitterX,
          y: row * cellH + cellH / 2 + jitterY,
          rotation: ROTATIONS[iconIdx % ROTATIONS.length],
          size: 44 + (iconIdx % 5) * 6,
          opacity: 0.2,
        });
        iconIdx++;
      }
    }
    return items;
  }, []);

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {icons.map((item, i) => (
        <Box
          key={i}
          component="img"
          src={item.src}
          alt=""
          sx={{
            position: 'absolute',
            left: `${item.x}%`,
            top: `${item.y}%`,
            width: item.size,
            height: item.size,
            transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`,
            opacity: item.opacity,
          }}
        />
      ))}
    </Box>
  );
}
