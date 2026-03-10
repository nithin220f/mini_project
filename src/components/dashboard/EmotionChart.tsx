import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import type { EmotionStats } from '../hooks/useEmotionDetection';

const EMOTION_COLORS: Record<string, string> = {
  angry: '#ef4444',
  disgusted: '#a855f7',
  fearful: '#f59e0b',
  happy: '#22c55e',
  neutral: '#64748b',
  sad: '#3b82f6',
  surprised: '#06b6d4',
};

interface EmotionChartProps {
  stats: EmotionStats;
}

export function EmotionChart({ stats }: EmotionChartProps) {
  const data = Object.entries(stats).map(([name, value]) => ({ name: name.slice(0, 3).toUpperCase(), fullName: name, value }));

  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
          <XAxis dataKey="name" tick={{ fill: 'hsl(215 15% 50%)', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'hsl(215 15% 50%)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Bar dataKey="value" radius={[2, 2, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.fullName} fill={EMOTION_COLORS[entry.fullName] || '#64748b'} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
