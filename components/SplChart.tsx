import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SplDataPoint, AnalysisStats } from '../types';
import { downsampleData } from '../utils/parser';

interface SplChartProps {
  data: SplDataPoint[];
  stats: AnalysisStats;
}

const SplChart: React.FC<SplChartProps> = ({ data, stats }) => {
  // Downsample data to prevent performance bottlenecks if log is huge
  const chartData = useMemo(() => downsampleData(data, 1500), [data]);

  // Dynamic Y-axis domain
  const minDomain = Math.floor(stats.minSpl - 5);
  const maxDomain = Math.ceil(stats.maxSpl + 5);

  return (
    <div className="w-full h-[400px] bg-slate-900/50 rounded-xl p-4 border border-slate-800">
      <h3 className="text-lg font-semibold text-slate-200 mb-4 px-2">SPL Over Time</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorSpl" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis 
            dataKey="timestamp" 
            stroke="#64748b" 
            tick={{fontSize: 12}} 
            minTickGap={50}
          />
          <YAxis 
            domain={[minDomain, maxDomain]} 
            stroke="#64748b" 
            tick={{fontSize: 12}}
            width={40}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
            itemStyle={{ color: '#60a5fa' }}
            labelStyle={{ color: '#94a3b8' }}
            formatter={(value: number) => [`${value} dB`, 'SPL']}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#3b82f6" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorSpl)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SplChart;