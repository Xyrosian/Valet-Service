import React, { useState, useEffect } from 'react';

const API_BASE = '/api';

// Icons as simple SVG components
const Icons = {
  Car: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 17h.01M16 17h.01M6 11h12M5 11l1.5-5h11l1.5 5M7 17a2 2 0 100-4 2 2 0 000 4zM17 17a2 2 0 100-4 2 2 0 000 4zM5 11v6h14v-6" /></svg>,
  User: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Phone: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
  Calendar: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Clock: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  MapPin: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Check: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  ChevronRight: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>,
  MessageCircle: () => <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
};

// Input Field Component
function InputField({ icon, label, className = '', ...props }) {
  return (
    <div className={className}>
      <label className="block text-sm text-stone-400 mb-2">{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={`w-full bg-stone-900 border border-stone-700 rounded-lg py-3 ${icon ? 'pl-12' : 'pl-4'} pr-4 text-white placeholder-stone-500 focus:outline-none focus:border-amber-600 transition`}
        />
      </div>
    </div>
  );
}

// Step Indicator
function StepIndicator({ num, current, label }) {
  const isActive = current >= num;
  return (
    <div className="flex items-center gap-2">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium transition ${
        isActive ? 'bg-amber-600 text-white' : 'bg-stone-800 text-stone-500'
      }`}>
        {current > num ? <Icons.Check /> : num}
      </div>
      <span className={`hidden sm:inline text-sm ${isActive ? 'text-white' : 'text-stone-500'}`}>
        {label}
      </span>
    </div>
  );
}

// Success Screen
function SuccessScreen({ phone }) {
  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-amber-600/20 rounded-full flex items-center justify-center mx-auto mb-8">
          <div className="w-14 h-14 bg-amber-600 rounded-full flex items-center justify-center">
            <Icons.Check />
          </div>
        </div>
        
        <h1 className="text-3xl font-light text-white mb-4">You're All Set</h1>
        
        <p className="text-stone-400 text-lg leading-relaxed mb-8">
          Your ride is confirmed. We've sent details to <span className="text-white">{phone}</span>.
        </p>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 text-left">
          <div className="flex items-start gap-4">
            <div className="text-amber-500">
              <Icons.MessageCircle />
            </div>
            <div>
              <h3 className="text-white font-medium mb-2">From now on, just text us</h3>
              <ul className="text-stone-400 text-sm space-y-2">
                <li>"I need a ride at 3pm"</li>
                <li>"Can we push my pickup 30 minutes?"</li>
                <li>"Where's my driver?"</li>
                <li>"Cancel my ride"</li>
              </ul>
            </div>
          </div>
        </div>

        <p className="text-stone-500 text-sm mt-8">
          You can close this page. We'll handle everything via text.
        </p>
      </div>
    </div>
  );
}

// Main Component
export default function GuestBooking() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hotelInfo, setHotelInfo] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    room_number: '',
    pickup_date: '',
    pickup_time: '',
    pickup_location: 'Hotel Lobby',
    dropoff_location: '',
    passenger_count: 1,
    special_requests: '',
    preferences: {
      temperature: 'comfortable',
      music: 'quiet',
      conversation: 'friendly'
    }
  });

  const urlParams = new URLSearchParams(window.location.search);
  const hotelId = urlParams.get('hotel') || 'demo-hotel';

  useEffect(() => {
    fetch(`${API_BASE}/hotels/${hotelId}`)
      .then(res => res.json())
      .then(data => setHotelInfo(data.hotel))
      .catch(() => setHotelInfo({ name: 'Grand Luxe Hotel', id: hotelId }));
  }, [hotelId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('pref_')) {
      setFormData(prev => ({
        ...prev,
        preferences: { ...prev.preferences, [name.replace('pref_', '')]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const guestRes = await fetch(`${API_BASE}/guests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          hotel_id: hotelId,
          room_number: formData.room_number,
          preferences: formData.preferences
        })
      });
      const guestData = await guestRes.json();

      const pickupDateTime = new Date(`${formData.pickup_date}T${formData.pickup_time}`);
      
      await fetch(`${API_BASE}/rides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_id: guestData.guest.id,
          hotel_id: hotelId,
          pickup_time: pickupDateTime.toISOString(),
          pickup_location: formData.pickup_location,
          dropoff_location: formData.dropoff_location,
          passenger_count: formData.passenger_count,
          special_requests: formData.special_requests
        })
      });

      setSuccess(true);
    } catch (error) {
      console.error('Booking error:', error);
      alert('Something went wrong. Please try again or contact the concierge.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return <SuccessScreen phone={formData.phone} />;
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
      `}</style>

      {/* Header */}
      <header className="border-b border-stone-800 px-6 py-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-amber-500"><Icons.Car /></span>
            <span className="text-stone-500 text-sm tracking-widest uppercase">Private Car Service</span>
          </div>
          <h1 className="text-3xl font-light tracking-tight">
            {hotelInfo?.name || 'Grand Luxe Hotel'}
          </h1>
        </div>
      </header>

      {/* Progress */}
      <div className="max-w-lg mx-auto px-6 py-6">
        <div className="flex items-center gap-2 text-sm">
          <StepIndicator num={1} current={step} label="Your Details" />
          <div className="flex-1 h-px bg-stone-800" />
          <StepIndicator num={2} current={step} label="First Ride" />
          <div className="flex-1 h-px bg-stone-800" />
          <StepIndicator num={3} current={step} label="Preferences" />
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-6 pb-12">
        
        {/* Step 1: Details */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <p className="text-stone-400 text-lg leading-relaxed">
              Welcome. Once you register, all future ride requests can be made via text message.
            </p>

            <InputField
              icon={<Icons.User />}
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="As you'd like to be addressed"
            />

            <InputField
              icon={<Icons.Phone />}
              label="Mobile Number"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="+1 (555) 000-0000"
            />

            <InputField
              label="Email (optional)"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="For ride confirmations"
            />

            <InputField
              label="Room Number"
              name="room_number"
              value={formData.room_number}
              onChange={handleChange}
              placeholder="e.g., 1204"
            />

            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!formData.name || !formData.phone}
              className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-stone-700 disabled:text-stone-500 text-white py-4 rounded-lg font-medium transition flex items-center justify-center gap-2"
            >
              Continue <Icons.ChevronRight />
            </button>
          </div>
        )}

        {/* Step 2: First Ride */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <p className="text-stone-400 text-lg leading-relaxed">
              Schedule your first ride. You can always text to change or add more.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <InputField
                icon={<Icons.Calendar />}
                label="Date"
                name="pickup_date"
                type="date"
                value={formData.pickup_date}
                onChange={handleChange}
                required
                min={today}
              />

              <InputField
                icon={<Icons.Clock />}
                label="Time"
                name="pickup_time"
                type="time"
                value={formData.pickup_time}
                onChange={handleChange}
                required
              />
            </div>

            <InputField
              icon={<Icons.MapPin />}
              label="Pickup Location"
              name="pickup_location"
              value={formData.pickup_location}
              onChange={handleChange}
              placeholder="Hotel Lobby"
            />

            <InputField
              icon={<Icons.MapPin />}
              label="Destination"
              name="dropoff_location"
              value={formData.dropoff_location}
              onChange={handleChange}
              required
              placeholder="Where would you like to go?"
            />

            <InputField
              label="Number of Passengers"
              name="passenger_count"
              type="number"
              min="1"
              max="6"
              value={formData.passenger_count}
              onChange={handleChange}
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-4 border border-stone-700 rounded-lg text-stone-400 hover:text-white hover:border-stone-500 transition"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!formData.pickup_date || !formData.pickup_time || !formData.dropoff_location}
                className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-700 disabled:text-stone-500 text-white py-4 rounded-lg font-medium transition flex items-center justify-center gap-2"
              >
                Continue <Icons.ChevronRight />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preferences */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <p className="text-stone-400 text-lg leading-relaxed">
              Help us personalize your experience. These are optional.
            </p>

            <div>
              <label className="block text-sm text-stone-400 mb-3">Temperature Preference</label>
              <div className="grid grid-cols-3 gap-3">
                {['cool', 'comfortable', 'warm'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleChange({ target: { name: 'pref_temperature', value: opt }})}
                    className={`py-3 rounded-lg border transition capitalize ${
                      formData.preferences.temperature === opt 
                        ? 'border-amber-600 bg-amber-600/10 text-amber-500' 
                        : 'border-stone-700 text-stone-400 hover:border-stone-500'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-stone-400 mb-3">Music Preference</label>
              <div className="grid grid-cols-3 gap-3">
                {['quiet', 'soft music', 'my choice'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleChange({ target: { name: 'pref_music', value: opt }})}
                    className={`py-3 rounded-lg border transition capitalize ${
                      formData.preferences.music === opt 
                        ? 'border-amber-600 bg-amber-600/10 text-amber-500' 
                        : 'border-stone-700 text-stone-400 hover:border-stone-500'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-stone-400 mb-2">Special Requests (optional)</label>
              <textarea
                name="special_requests"
                value={formData.special_requests}
                onChange={handleChange}
                rows={3}
                placeholder="Child seat, wheelchair accessible, specific route preferences..."
                className="w-full bg-stone-900 border border-stone-700 rounded-lg py-3 px-4 text-white placeholder-stone-500 focus:outline-none focus:border-amber-600 transition resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-4 border border-stone-700 rounded-lg text-stone-400 hover:text-white hover:border-stone-500 transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-700 text-white py-4 rounded-lg font-medium transition flex items-center justify-center gap-2"
              >
                {loading ? 'Confirming...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
