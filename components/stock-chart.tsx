'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

interface ChartProps {
  data: { date: string; price: number }[]
  color?: string
  reverseData?: boolean // Set to true if data arrives newest-first
}

export function StockChart({ data, color = '#f59e0b', reverseData = false }: ChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
        No history recorded yet.
      </div>
    )
  }

  // 1. Ensure chronological order (Past = Left, Present = Right)
  const orderedData = reverseData ? [...data].reverse() : data

  // 2. Map data with unique chartIndex and ensure valid numeric prices
  const safeData = orderedData.map((item, index) => ({
    ...item,
    price: Number(item.price),
    chartIndex: index,
  }))

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={safeData} margin={{ top: 10, right: 15, left: 15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          
          <XAxis 
            dataKey="chartIndex" 
            stroke="#64748b" 
            fontSize={12} 
            tickLine={false} 
            tickFormatter={(index) => safeData[index]?.date || ''} 
          />
          
          {/* FIX: Tight domain scaling + forced 2-decimal tick formatting */}
          <YAxis 
            stroke="#64748b" 
            fontSize={12} 
            tickLine={false} 
            domain={['dataMin - 0.05', 'dataMax + 0.05']}
            tickFormatter={(val) => `$${Number(val).toFixed(2)}`}
          />
          
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
            labelFormatter={(label) => safeData[label as number]?.date || ''}
            formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Value']}
          />
          
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke={color} 
            strokeWidth={3} 
            dot={{ r: 4, fill: color }}
            activeDot={{ r: 6 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}