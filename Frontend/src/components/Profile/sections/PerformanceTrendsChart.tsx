import { Activity } from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import type { ServiceResponse } from '../../../api/serviceApi';

interface PerformanceTrendsChartProps {
  services: ServiceResponse[];
}

export default function PerformanceTrendsChart({ services }: PerformanceTrendsChartProps) {
  if (services.length === 0) return null;

  return (
    <div className="backdrop-blur-md bg-white/70 border border-gray-100 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] p-6 hover:shadow-[0_12px_48px_0_rgba(0,0,0,0.15)] transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-br from-black from-30% to-black/40 bg-clip-text text-transparent flex items-center gap-2">
            <Activity className="h-6 w-6 text-gray-900" />
            Performance Trends
          </h2>
          <p className="text-sm text-gray-500 font-medium">Service ratings and review trends</p>
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={services.slice(0, 8).map(service => ({
              name: service.title && service.title.length > 12 ? service.title.substring(0, 12) + '...' : service.title || 'Untitled',
              rating: service.averageRating || 0,
              reviews: service.reviewCount || 0
            }))}
            margin={{ top: 10, right: 30, left: 0, bottom: 60 }}
          >
            <defs>
              <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#000000" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#000000" stopOpacity={0.05}/>
              </linearGradient>
              <linearGradient id="reviewsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#666666" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#666666" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fill: 'currentColor', fontSize: 12 }}
              className="text-gray-500"
            />
            <YAxis
              yAxisId="left"
              domain={[0, 5]}
              ticks={[0, 1, 2, 3, 4, 5]}
              tick={{ fill: 'currentColor', fontSize: 12 }}
              className="text-gray-500"
              label={{ value: 'Rating', angle: -90, position: 'insideLeft', fill: 'currentColor' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: 'currentColor', fontSize: 12 }}
              className="text-gray-500"
              label={{ value: 'Reviews', angle: 90, position: 'insideRight', fill: 'currentColor' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: '12px',
                padding: '12px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
              }}
              labelStyle={{ color: '#000', fontWeight: 'bold', marginBottom: '4px' }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="rating"
              stroke="#ffffffff"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#ratingGradient)"
              name="Average Rating"
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="reviews"
              stroke="#666666"
              strokeWidth={2}
              strokeDasharray="5 5"
              fillOpacity={1}
              fill="url(#reviewsGradient)"
              name="Total Reviews"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
