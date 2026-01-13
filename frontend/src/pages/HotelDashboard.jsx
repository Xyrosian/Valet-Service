import React, { useState, useEffect } from 'react';

const API_BASE = '/api';

// Simple icon components
const Icons = {
  Car: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 17h.01M16 17h.01M6 11h12M5 11l1.5-5h11l1.5 5M7 17a2 2 0 100-4 2 2 0 000 4zM17 17a2 2 0 100-4 2 2 0 000 4z" /></svg>,
  Plus: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  Calendar: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Users: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Clock: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  MapPin: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>,
  Phone: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
  X: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  ChevronLeft: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>,
  ChevronRight: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>,
  Check: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  Refresh: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  BarChart: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  Bell: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
};

// Status badge component
function StatusBadge({ status }) {
  const styles = {
    scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    in_progress: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    completed: 'bg-stone-500/10 text-stone-400 border-stone-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded border ${styles[status] || styles.scheduled}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

// Stat Card
function StatCard({ icon, label, value, color = 'amber' }) {
  const colors = {
    amber: 'bg-amber-500/10 text-amber-500',
    blue: 'bg-blue-500/10 text-blue-500',
    emerald: 'bg-emerald-500/10 text-emerald-500',
    purple: 'bg-purple-500/10 text-purple-500',
  };

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
      <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <div className="text-2xl font-semibold text-white mb-1">{value}</div>
      <div className="text-sm text-stone-400">{label}</div>
    </div>
  );
}

// Ride Card
function RideCard({ ride, onStatusChange }) {
  const pickupTime = new Date(ride.pickup_time);
  const isToday = pickupTime.toDateString() === new Date().toDateString();
  const isPast = pickupTime < new Date();

  return (
    <div className={`bg-stone-900 border border-stone-800 rounded-xl p-5 ${isPast && ride.status === 'scheduled' ? 'border-amber-500/50' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white font-medium">{ride.guest_name}</span>
            {ride.room_number && (
              <span className="text-stone-500 text-sm">Room {ride.room_number}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-stone-400 text-sm">
            <Icons.Phone />
            <span>{ride.guest_phone}</span>
          </div>
        </div>
        <StatusBadge status={ride.status} />
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-amber-500"><Icons.Clock /></div>
          <div>
            <div className="text-white">
              {pickupTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </div>
            <div className="text-stone-500 text-sm">
              {isToday ? 'Today' : pickupTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-emerald-500"><Icons.MapPin /></div>
          <div>
            <div className="text-white">{ride.pickup_location}</div>
            <div className="text-stone-500 text-sm">→ {ride.dropoff_location}</div>
          </div>
        </div>

        {ride.driver_name && (
          <div className="flex items-center gap-3">
            <div className="text-blue-500"><Icons.Car /></div>
            <div className="text-stone-300">{ride.driver_name}</div>
          </div>
        )}
      </div>

      {ride.special_requests && (
        <div className="text-sm text-stone-400 bg-stone-800/50 rounded-lg p-3 mb-4">
          {ride.special_requests}
        </div>
      )}

      {ride.status === 'scheduled' && (
        <div className="flex gap-2">
          <button
            onClick={() => onStatusChange(ride.id, 'confirmed')}
            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition flex items-center justify-center gap-1"
          >
            <Icons.Check /> Confirm
          </button>
          <button
            onClick={() => onStatusChange(ride.id, 'cancelled')}
            className="px-4 py-2 border border-stone-700 text-stone-400 hover:text-white hover:border-stone-500 text-sm rounded-lg transition"
          >
            Cancel
          </button>
        </div>
      )}

      {ride.status === 'confirmed' && (
        <button
          onClick={() => onStatusChange(ride.id, 'in_progress')}
          className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition"
        >
          Start Ride
        </button>
      )}

      {ride.status === 'in_progress' && (
        <button
          onClick={() => onStatusChange(ride.id, 'completed')}
          className="w-full py-2 bg-stone-700 hover:bg-stone-600 text-white text-sm font-medium rounded-lg transition"
        >
          Complete Ride
        </button>
      )}
    </div>
  );
}

// New Ride Modal
function NewRideModal({ isOpen, onClose, onSubmit, drivers }) {
  const [formData, setFormData] = useState({
    guest_name: '',
    guest_phone: '',
    guest_room: '',
    driver_id: '',
    pickup_date: new Date().toISOString().split('T')[0],
    pickup_time: '',
    pickup_location: 'Hotel Lobby',
    dropoff_location: '',
    passenger_count: 1,
    special_requests: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-stone-800">
          <h2 className="text-xl font-semibold text-white">Schedule New Ride</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-white transition">
            <Icons.X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-stone-400 mb-2">Guest Name</label>
              <input
                type="text"
                value={formData.guest_name}
                onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                required
                className="w-full bg-stone-800 border border-stone-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-amber-600"
                placeholder="Guest name"
              />
            </div>

            <div>
              <label className="block text-sm text-stone-400 mb-2">Phone</label>
              <input
                type="tel"
                value={formData.guest_phone}
                onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
                required
                className="w-full bg-stone-800 border border-stone-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-amber-600"
                placeholder="+1 555 0000"
              />
            </div>

            <div>
              <label className="block text-sm text-stone-400 mb-2">Room</label>
              <input
                type="text"
                value={formData.guest_room}
                onChange={(e) => setFormData({ ...formData, guest_room: e.target.value })}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-amber-600"
                placeholder="1204"
              />
            </div>

            <div>
              <label className="block text-sm text-stone-400 mb-2">Date</label>
              <input
                type="date"
                value={formData.pickup_date}
                onChange={(e) => setFormData({ ...formData, pickup_date: e.target.value })}
                required
                className="w-full bg-stone-800 border border-stone-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block text-sm text-stone-400 mb-2">Time</label>
              <input
                type="time"
                value={formData.pickup_time}
                onChange={(e) => setFormData({ ...formData, pickup_time: e.target.value })}
                required
                className="w-full bg-stone-800 border border-stone-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-amber-600"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm text-stone-400 mb-2">Pickup Location</label>
              <input
                type="text"
                value={formData.pickup_location}
                onChange={(e) => setFormData({ ...formData, pickup_location: e.target.value })}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-amber-600"
                placeholder="Hotel Lobby"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm text-stone-400 mb-2">Destination</label>
              <input
                type="text"
                value={formData.dropoff_location}
                onChange={(e) => setFormData({ ...formData, dropoff_location: e.target.value })}
                required
                className="w-full bg-stone-800 border border-stone-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-amber-600"
                placeholder="Where are they going?"
              />
            </div>

            <div>
              <label className="block text-sm text-stone-400 mb-2">Driver</label>
              <select
                value={formData.driver_id}
                onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-amber-600"
              >
                <option value="">Auto-assign</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-stone-400 mb-2">Passengers</label>
              <input
                type="number"
                min="1"
                max="6"
                value={formData.passenger_count}
                onChange={(e) => setFormData({ ...formData, passenger_count: parseInt(e.target.value) })}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-amber-600"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm text-stone-400 mb-2">Special Requests</label>
              <textarea
                value={formData.special_requests}
                onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                rows={2}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-amber-600 resize-none"
                placeholder="Any special requirements..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-stone-700 text-stone-400 hover:text-white hover:border-stone-500 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition"
            >
              Schedule Ride
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main Dashboard Component
export default function HotelDashboard() {
  const [rides, setRides] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showNewRide, setShowNewRide] = useState(false);
  const [loading, setLoading] = useState(true);

  // Demo hotel ID - in production this comes from auth
  const hotelId = '7aee4163-12bc-4a40-9eee-ea7bb20e75d3';

  const fetchData = async () => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      const [ridesRes, driversRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/hotels/${hotelId}/rides?date=${dateStr}`),
        fetch(`${API_BASE}/hotels/${hotelId}/drivers`),
        fetch(`${API_BASE}/hotels/${hotelId}/stats`)
      ]);

      const [ridesData, driversData, statsData] = await Promise.all([
        ridesRes.json(),
        driversRes.json(),
        statsRes.json()
      ]);

      setRides(ridesData.rides || []);
      setDrivers(driversData.drivers || []);
      setStats(statsData.stats || {});
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  const handleStatusChange = async (rideId, newStatus) => {
    try {
      await fetch(`${API_BASE}/rides/${rideId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchData();
    } catch (error) {
      console.error('Error updating ride:', error);
    }
  };

  const handleNewRide = async (formData) => {
    try {
      const pickupDateTime = new Date(`${formData.pickup_date}T${formData.pickup_time}`);
      
      await fetch(`${API_BASE}/hotels/${hotelId}/rides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          pickup_time: pickupDateTime.toISOString()
        })
      });
      fetchData();
    } catch (error) {
      console.error('Error creating ride:', error);
    }
  };

  const changeDate = (delta) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + delta);
    setSelectedDate(newDate);
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* Header */}
      <header className="border-b border-stone-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
              <Icons.Car />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Valet Dashboard</h1>
              <p className="text-stone-500 text-sm">Grand Luxe Hotel</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/settings/reminders"
              className="p-2.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg border border-stone-700 hover:border-stone-600 transition"
              title="Reminder Settings"
            >
              <Icons.Bell />
            </a>
            <a
              href="/analytics"
              className="flex items-center gap-2 text-stone-400 hover:text-white px-4 py-2.5 rounded-lg border border-stone-700 hover:border-stone-600 transition"
            >
              <Icons.BarChart /> Analytics
            </a>
            <button
              onClick={() => setShowNewRide(true)}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2.5 rounded-lg font-medium transition"
            >
              <Icons.Plus /> New Ride
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Icons.Calendar />}
            label="Today's Rides"
            value={stats.today_rides || 0}
            color="amber"
          />
          <StatCard
            icon={<Icons.Clock />}
            label="Pending"
            value={stats.pending_rides || 0}
            color="blue"
          />
          <StatCard
            icon={<Icons.Check />}
            label="Completed Today"
            value={stats.completed_today || 0}
            color="emerald"
          />
          <StatCard
            icon={<Icons.Users />}
            label="Active Drivers"
            value={stats.active_drivers || 0}
            color="purple"
          />
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => changeDate(-1)}
              className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition"
            >
              <Icons.ChevronLeft />
            </button>
            
            <div className="text-center">
              <div className="text-lg font-medium text-white">
                {isToday ? 'Today' : selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
              </div>
              <div className="text-sm text-stone-400">
                {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>

            <button
              onClick={() => changeDate(1)}
              className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition"
            >
              <Icons.ChevronRight />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {!isToday && (
              <button
                onClick={() => setSelectedDate(new Date())}
                className="text-sm text-amber-500 hover:text-amber-400 transition"
              >
                Jump to Today
              </button>
            )}
            <button
              onClick={fetchData}
              className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition"
              title="Refresh"
            >
              <Icons.Refresh />
            </button>
          </div>
        </div>

        {/* Rides Grid */}
        {loading ? (
          <div className="text-center py-12 text-stone-400">Loading...</div>
        ) : rides.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icons.Calendar />
            </div>
            <p className="text-stone-400 mb-4">No rides scheduled for this day</p>
            <button
              onClick={() => setShowNewRide(true)}
              className="text-amber-500 hover:text-amber-400 font-medium"
            >
              Schedule a ride
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rides.map(ride => (
              <RideCard
                key={ride.id}
                ride={ride}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </main>

      <NewRideModal
        isOpen={showNewRide}
        onClose={() => setShowNewRide(false)}
        onSubmit={handleNewRide}
        drivers={drivers}
      />
    </div>
  );
}
