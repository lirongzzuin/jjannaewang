'use client';

interface MiniSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  trend?: 'up' | 'down' | 'stable';
}

export default function MiniSparkline({
  data,
  width = 64,
  height = 24,
  trend,
}: MiniSparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  const isDown = data[data.length - 1] < data[0];
  const color = trend === 'down' || isDown ? '#22c55e' : '#ef4444';
  const bgColor = trend === 'down' || isDown ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)';

  return (
    <div className="flex items-center justify-center rounded overflow-hidden" style={{ width, height, background: bgColor }}>
      <svg width={width} height={height}>
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
