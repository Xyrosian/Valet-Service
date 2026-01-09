import React, { useState, useEffect } from 'react';

const API_BASE = '/api';

// Icons
const Icons = {
  Car: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 17h.01M16 17h.01M6 11h12M5 11l1.5-5h11l1.5 5M7 17a2 2 0 100-4 2 2 0 000 4zM17 17a2 2 0 100-4 2 2 0 000 4z" /></svg>,
  Users: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Clock: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  MapPin: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>,
  TrendingUp: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
  TrendingDown: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" /></svg>,
  XCircle: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Route: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>,
  ChevronLeft: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>,
  BarChart: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  Calendar: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  User: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
};

// Metric Card Component
function MetricCard({ icon, label, value, subValue, trend, trendValue, color = 'amber' }) {
  const colors = {
    amber: 'bg-amber-500/10 text-amber-500',
    blue: 'bg-blue-500/10 text-blue-500',
    emerald: 'bg-emerald-500/10 text-emerald-500',
    purple: 'bg-purple-500/10 text-purple-500',
    red: 'bg-red-500/10 text-red-500',
  };

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center`}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend >= 0 ? <Icons.TrendingUp /> : <Icons.TrendingDown />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div className="text-2xl font-semibold text-white mb-1">{value}</div>
      <div className="text-sm text-stone-400">{label}</div>
      {subValue && <div className="text-xs text-stone-500 mt-1">{subValue}</div>}
    </div>
  );
}

// Simple Bar Chart Component
function BarChart({ data, dataKey, labelKey, color = '#f59e0b', height = 200 }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-stone-500">
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d[dataKey] || 0));
  
  return (
    <div className="flex items-end gap-1 h-48" style={{ height }}>
      {data.map((item, index) => {
        const value = item[dataKey] || 0;
        const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
        
        return (
          <div key={index} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col items-center justify-end" style={{ height: height - 24 }}>
              <span className="text-xs text-stone-400 mb-1">{value}</span>
              <div
                className="w-full rounded-t transition-all duration-300 hover:opacity-80"
                style={{ 
                  height: `${Math.max(percentage, 2)}%`,
                  backgroundColor: color,
                  minHeight: value > 0 ? '4px' : '0'
                }}
              />
            </div>
            <span className="text-xs text-stone-500 truncate w-full text-center">
              {item[labelKey]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Driver Row Component
function DriverRow({ driver, onClick }) {
  return (
    <div 
      onClick={() => onClick(driver)}
      className="flex items-center gap-4 p-4 bg-stone-900 border border-stone-800 rounded-xl hover:border-stone-700 cursor-pointer transition"
    >
      <div className="w-12 h-12 bg-stone-800 rounded-full flex items-center justify-center text-stone-400">
        <Icons.User />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="font-medium text-white truncate">{driver.name}</div>
        <div className="text-sm text-stone-500">{driver.phone}</div>
      </div>

      <div className="grid grid-cols-5 gap-6 text-center">
        <div>
          <div className="text-lg font-semibold text-white">{driver.completed_rides || 0}</div>
          <div className="text-xs text-stone-500">Rides</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-white">{driver.total_passengers || 0}</div>
          <div className="text-xs text-stone-500">Passengers</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-white">
            {Math.round(driver.estimated_miles || 0)}
          </div>
          <div className="text-xs text-stone-500">Miles</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-white">
            {Math.round(driver.avg_ride_duration_minutes || 0)}m
          </div>
          <div className="text-xs text-stone-500">Avg Time</div>
        </div>
        <div>
          <div className={`text-lg font-semibold ${
            (driver.cancellation_rate || 0) > 10 ? 'text-red-400' : 'text-white'
          }`}>
            {driver.cancellation_rate || 0}%
          </div>
          <div className="text-xs text-stone-500">Cancelled</div>
        </div>
      </div>
    </div>
  );
}

// Driver Detail Modal
function DriverDetailModal({ driver, driverDetails, onClose }) {
  if (!driver) return null;

  const details = driverDetails || {};
  const metrics = details.metrics || {};
  const dailyData = (details.daily_breakdown || []).map(d => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })
  }));
  const hourlyData = (details.hourly_distribution || []).map(d => ({
    ...d,
    label: `${d.hour}:00`
  }));

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-800 sticky top-0 bg-stone-900 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition"
            >
              <Icons.ChevronLeft />
            </button>
            <div>
              <h2 className="text-xl font-semibold text-white">{driver.name}</h2>
              <p className="text-sm text-stone-400">{driver.phone}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <MetricCard
              icon={<Icons.Car />}
              label="Total Rides"
              value={metrics.completed_rides || 0}
              color="amber"
            />
            <MetricCard
              icon={<Icons.Users />}
              label="Passengers"
              value={metrics.total_passengers || 0}
              color="blue"
            />
            <MetricCard
              icon={<Icons.Route />}
              label="Miles Driven"
              value={Math.round(metrics.estimated_miles || 0)}
              color="emerald"
            />
            <MetricCard
              icon={<Icons.Clock />}
              label="Avg Ride Time"
              value={`${Math.round(metrics.avg_ride_duration_minutes || 0)}m`}
              subValue={`${Math.round(metrics.min_ride_duration_minutes || 0)}m - ${Math.round(metrics.max_ride_duration_minutes || 0)}m`}
              color="purple"
            />
            <MetricCard
              icon={<Icons.XCircle />}
              label="Cancellations"
              value={metrics.cancelled_rides || 0}
              color="red"
            />
          </div>

          {/* Charts Row */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Daily Rides */}
            <div className="bg-stone-800/50 rounded-xl p-5">
              <h3 className="text-sm font-medium text-stone-300 mb-4">Daily Rides</h3>
              <BarChart 
                data={dailyData} 
                dataKey="completed_rides" 
                labelKey="label"
                color="#f59e0b"
              />
            </div>

            {/* Hourly Distribution */}
            <div className="bg-stone-800/50 rounded-xl p-5">
              <h3 className="text-sm font-medium text-stone-300 mb-4">Peak Hours</h3>
              <BarChart 
                data={hourlyData} 
                dataKey="ride_count" 
                labelKey="label"
                color="#3b82f6"
              />
            </div>
          </div>

          {/* Top Destinations */}
          {details.top_destinations && details.top_destinations.length > 0 && (
            <div className="bg-stone-800/50 rounded-xl p-5">
              <h3 className="text-sm font-medium text-stone-300 mb-4">Top Destinations</h3>
              <div className="space-y-3">
                {details.top_destinations.slice(0, 5).map((dest, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-stone-700 rounded-full flex items-center justify-center text-xs text-stone-300">
                        {index + 1}
                      </span>
                      <span className="text-stone-200">{dest.dropoff_location}</span>
                    </div>
                    <span className="text-stone-400">{dest.visit_count} trips</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vehicle Info */}
          {driver.vehicle_info && Object.keys(driver.vehicle_info).length > 0 && (
            <div className="bg-stone-800/50 rounded-xl p-5">
              <h3 className="text-sm font-medium text-stone-300 mb-4">Vehicle</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {driver.vehicle_info.make && (
                  <div>
                    <span className="text-stone-500">Make:</span>
                    <span className="text-white ml-2">{driver.vehicle_info.make}</span>
                  </div>
                )}
                {driver.vehicle_info.model && (
                  <div>
                    <span className="text-stone-500">Model:</span>
                    <span className="text-white ml-2">{driver.vehicle_info.model}</span>
                  </div>
                )}
                {driver.vehicle_info.year && (
                  <div>
                    <span className="text-stone-500">Year:</span>
                    <span className="text-white ml-2">{driver.vehicle_info.year}</span>
                  </div>
                )}
                {driver.vehicle_info.plate && (
                  <div>
                    <span className="text-stone-500">Plate:</span>
                    <span className="text-white ml-2">{driver.vehicle_info.plate}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Date Range Picker
function DateRangePicker({ startDate, endDate, onChange }) {
  const presets = [
    { label: '7 Days', days: 7 },
    { label: '30 Days', days: 30 },
    { label: '90 Days', days: 90 },
  ];

  const handlePreset = (days) => {
    const end = new Date();
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    onChange(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex bg-stone-800 rounded-lg p-1">
        {presets.map(preset => {
          const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
          const isActive = days === preset.days;
          return (
            <button
              key={preset.days}
              onClick={() => handlePreset(preset.days)}
              className={`px-3 py-1.5 text-sm rounded-md transition ${
                isActive 
                  ? 'bg-amber-600 text-white' 
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
      
      <div className="flex items-center gap-2 text-sm">
        <input
          type="date"
          value={startDate}
          onChange={(e) => onChange(e.target.value, endDate)}
          className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-600"
        />
        <span className="text-stone-500">to</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onChange(startDate, e.target.value)}
          className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-amber-600"
        />
      </div>
    </div>
  );
}

// Main Analytics Dashboard
export default function AnalyticsDashboard() {
  const [overview, setOverview] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [driverDetails, setDriverDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return { start, end };
  });

  // Demo hotel ID
  const hotelId = 'demo-hotel';

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = `start_date=${dateRange.start}&end_date=${dateRange.end}`;
      
      const [overviewRes, driversRes] = await Promise.all([
        fetch(`${API_BASE}/analytics/hotel/${hotelId}/overview?${params}`),
        fetch(`${API_BASE}/analytics/hotel/${hotelId}/drivers?${params}`)
      ]);

      const [overviewData, driversData] = await Promise.all([
        overviewRes.json(),
        driversRes.json()
      ]);

      setOverview(overviewData);
      setDrivers(driversData.drivers || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDriverDetails = async (driverId) => {
    try {
      const params = `start_date=${dateRange.start}&end_date=${dateRange.end}`;
      const res = await fetch(`${API_BASE}/analytics/driver/${driverId}?${params}`);
      const data = await res.json();
      setDriverDetails(data);
    } catch (error) {
      console.error('Error fetching driver details:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  useEffect(() => {
    if (selectedDriver) {
      fetchDriverDetails(selectedDriver.id);
    }
  }, [selectedDriver]);

  const handleDateChange = (start, end) => {
    setDateRange({ start, end });
  };

  const handleDriverClick = (driver) => {
    setSelectedDriver(driver);
    setDriverDetails(null);
  };

  const handleCloseDetail = () => {
    setSelectedDriver(null);
    setDriverDetails(null);
  };

  const dailyTrendData = (overview?.daily_trend || []).map(d => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }));

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* Header */}
      <header className="border-b border-stone-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
              <Icons.BarChart />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Driver Analytics</h1>
              <p className="text-stone-500 text-sm">Grand Luxe Hotel</p>
            </div>
          </div>

          <a 
            href="/dashboard"
            className="text-sm text-stone-400 hover:text-white transition"
          >
            ← Back to Dashboard
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Date Range */}
        <div className="mb-8">
          <DateRangePicker
            startDate={dateRange.start}
            endDate={dateRange.end}
            onChange={handleDateChange}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-stone-400">Loading analytics...</div>
          </div>
        ) : (
          <>
            {/* Overview Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
              <MetricCard
                icon={<Icons.Car />}
                label="Total Rides"
                value={overview?.overview?.completed_rides || 0}
                trend={overview?.comparison?.rides_change}
                color="amber"
              />
              <MetricCard
                icon={<Icons.Users />}
                label="Passengers"
                value={overview?.overview?.total_passengers || 0}
                trend={overview?.comparison?.passengers_change}
                color="blue"
              />
              <MetricCard
                icon={<Icons.Route />}
                label="Miles Driven"
                value={Math.round(overview?.overview?.total_estimated_miles || 0)}
                trend={overview?.comparison?.miles_change}
                color="emerald"
              />
              <MetricCard
                icon={<Icons.Clock />}
                label="Avg Ride Time"
                value={`${Math.round(overview?.overview?.avg_ride_duration_minutes || 0)}m`}
                color="purple"
              />
              <MetricCard
                icon={<Icons.XCircle />}
                label="Cancellations"
                value={overview?.overview?.cancelled_rides || 0}
                color="red"
              />
              <MetricCard
                icon={<Icons.User />}
                label="Active Drivers"
                value={overview?.overview?.active_drivers || 0}
                color="amber"
              />
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-stone-900 border border-stone-800 rounded-xl p-6">
                <h3 className="text-sm font-medium text-stone-300 mb-4">Daily Rides</h3>
                <BarChart 
                  data={dailyTrendData} 
                  dataKey="completed" 
                  labelKey="label"
                  color="#f59e0b"
                  height={200}
                />
              </div>

              <div className="bg-stone-900 border border-stone-800 rounded-xl p-6">
                <h3 className="text-sm font-medium text-stone-300 mb-4">Peak Hours</h3>
                <BarChart 
                  data={(overview?.peak_hours || []).map(h => ({ ...h, label: `${h.hour}:00` }))} 
                  dataKey="ride_count" 
                  labelKey="label"
                  color="#3b82f6"
                  height={200}
                />
              </div>
            </div>

            {/* Driver List */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-white">Driver Performance</h2>
              <p className="text-sm text-stone-400">Click on a driver to view detailed metrics</p>
            </div>

            <div className="space-y-3">
              {drivers.length === 0 ? (
                <div className="text-center py-12 text-stone-400">
                  No driver data available for this period
                </div>
              ) : (
                drivers.map(driver => (
                  <DriverRow 
                    key={driver.id} 
                    driver={driver} 
                    onClick={handleDriverClick}
                  />
                ))
              )}
            </div>
          </>
        )}
      </main>

      {/* Driver Detail Modal */}
      {selectedDriver && (
        <DriverDetailModal
          driver={selectedDriver}
          driverDetails={driverDetails}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
}
