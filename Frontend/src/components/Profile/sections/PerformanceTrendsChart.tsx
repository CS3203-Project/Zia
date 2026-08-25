import { Activity, PieChart as PieChartIcon } from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import type { ServiceResponse } from '../../../api/serviceApi';

interface PerformanceTrendsChartProps {
  services: ServiceResponse[];
}

const SLICE_COLORS = ['#f97316', '#fb923c', '#fdba74', '#f59e0b', '#fbbf24', '#eab308', '#d97706', '#c2410c'];

export default function PerformanceTrendsChart({ services }: PerformanceTrendsChartProps) {
  if (services.length === 0) return null;

  const statusData = [
    { name: 'Active', value: services.filter(s => s.isActive).length },
    { name: 'Inactive', value: services.filter(s => !s.isActive).length },
  ].filter(entry => entry.value > 0);

  const reviewsData = services
    .map(service => ({
      name: service.title && service.title.length > 16 ? service.title.substring(0, 16) + '...' : service.title || 'Untitled',
      value: service.reviewCount || 0,
    }))
    .filter(entry => entry.value > 0);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Activity className="h-6 w-6 text-orange-600" />
          Performance Trends
        </h2>
        <p className="text-sm text-gray-500 font-medium">Service ratings and review trends</p>
      </div>

      {/* Ratings & Reviews Trend */}
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
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f97316" stopOpacity={0.05}/>
              </linearGradient>
              <linearGradient id="reviewsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#9ca3af" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
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
              stroke="#f97316"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#ratingGradient)"
              name="Average Rating"
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="reviews"
              stroke="#9ca3af"
              strokeWidth={2}
              strokeDasharray="5 5"
              fillOpacity={1}
              fill="url(#reviewsGradient)"
              name="Total Reviews"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Pie charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-100">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
            <PieChartIcon className="h-4 w-4 text-orange-600" />
            Service Status
          </h3>
          {statusData.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={entry.name} fill={index === 0 ? '#f97316' : '#e5e7eb'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid rgba(0,0,0,0.1)',
                      borderRadius: '12px',
                      padding: '8px 12px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-16">No services yet</p>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
            <PieChartIcon className="h-4 w-4 text-orange-600" />
            Reviews by Service
          </h3>
          {reviewsData.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reviewsData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {reviewsData.map((entry, index) => (
                      <Cell key={entry.name} fill={SLICE_COLORS[index % SLICE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid rgba(0,0,0,0.1)',
                      borderRadius: '12px',
                      padding: '8px 12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-16">No reviews yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
