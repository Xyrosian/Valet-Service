import React, { useState, useEffect } from 'react';

const API_BASE = '/api';

// Icons
const Icons = {
  Bell: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
  Save: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  Send: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>,
  Eye: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  Clock: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Check: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  X: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  ChevronLeft: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>,
  Info: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  MessageSquare: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
};

// Toggle Switch Component
function Toggle({ enabled, onChange, label }) {
  return (
    <label className="flex items-center cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={enabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className={`w-11 h-6 rounded-full transition ${enabled ? 'bg-amber-600' : 'bg-stone-700'}`} />
        <div className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition transform ${enabled ? 'translate-x-5' : ''}`} />
      </div>
      {label && <span className="ml-3 text-stone-300">{label}</span>}
    </label>
  );
}

// Variable Tag Component
function VariableTag({ variable, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(variable.key)}
      className="px-2 py-1 bg-stone-700 hover:bg-stone-600 text-stone-300 text-xs rounded transition"
      title={variable.description}
    >
      {variable.key}
    </button>
  );
}

// Upcoming Ride Card with manual send
function UpcomingRideCard({ ride, onSendReminder }) {
  const [sending, setSending] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const pickupTime = new Date(ride.pickup_time);
  const minutesUntil = Math.round((pickupTime - new Date()) / 60000);

  const handleSend = async (useCustom = false) => {
    setSending(true);
    try {
      await onSendReminder(ride.id, useCustom ? customMessage : null);
      setShowCustom(false);
      setCustomMessage('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-stone-800/50 rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-medium text-white">{ride.guest_name}</div>
          <div className="text-sm text-stone-400">Room {ride.room_number || 'N/A'}</div>
        </div>
        <div className="text-right">
          <div className="text-white">
            {pickupTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </div>
          <div className={`text-sm ${minutesUntil <= 10 ? 'text-amber-400' : 'text-stone-400'}`}>
            {minutesUntil > 0 ? `in ${minutesUntil} min` : 'now'}
          </div>
        </div>
      </div>

      <div className="text-sm text-stone-400 mb-3">
        {ride.pickup_location} → {ride.dropoff_location}
      </div>

      {ride.reminder_sent ? (
        <div className="flex items-center gap-2 text-emerald-400 text-sm">
          <Icons.Check /> Reminder sent
        </div>
      ) : (
        <div className="space-y-2">
          {showCustom ? (
            <div className="space-y-2">
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Type custom message..."
                rows={2}
                className="w-full bg-stone-900 border border-stone-700 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-amber-600 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleSend(true)}
                  disabled={sending || !customMessage.trim()}
                  className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-700 text-white text-sm rounded-lg transition flex items-center justify-center gap-1"
                >
                  <Icons.Send /> Send Custom
                </button>
                <button
                  onClick={() => setShowCustom(false)}
                  className="px-3 py-2 border border-stone-700 text-stone-400 hover:text-white rounded-lg transition"
                >
                  <Icons.X />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => handleSend(false)}
                disabled={sending}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-700 text-white text-sm rounded-lg transition flex items-center justify-center gap-1"
              >
                <Icons.Send /> {sending ? 'Sending...' : 'Send Reminder'}
              </button>
              <button
                onClick={() => setShowCustom(true)}
                className="px-3 py-2 border border-stone-700 text-stone-400 hover:text-white hover:border-stone-600 rounded-lg transition"
                title="Send custom message"
              >
                <Icons.MessageSquare />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Main Settings Component
export default function ReminderSettings() {
  const [settings, setSettings] = useState({
    enabled: true,
    minutes_before: 5,
    templates: {
      five_minute: '',
      fifteen_minute: '',
      driver_arrived: '',
      driver_enroute: ''
    }
  });
  const [variables, setVariables] = useState([]);
  const [defaultTemplates, setDefaultTemplates] = useState({});
  const [upcomingRides, setUpcomingRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState('');
  const [activeTemplate, setActiveTemplate] = useState('five_minute');

  const hotelId = 'demo-hotel';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [settingsRes, variablesRes, pendingRes] = await Promise.all([
        fetch(`${API_BASE}/reminders/hotel/${hotelId}/settings`),
        fetch(`${API_BASE}/reminders/variables`),
        fetch(`${API_BASE}/reminders/hotel/${hotelId}/pending`)
      ]);

      const [settingsData, variablesData, pendingData] = await Promise.all([
        settingsRes.json(),
        variablesRes.json(),
        pendingRes.json()
      ]);

      setSettings(settingsData.settings);
      setVariables(variablesData.variables);
      setDefaultTemplates(variablesData.default_templates);
      setUpcomingRides(pendingData.rides || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`${API_BASE}/reminders/hotel/${hotelId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleTemplateChange = (type, value) => {
    setSettings(prev => ({
      ...prev,
      templates: { ...prev.templates, [type]: value }
    }));
  };

  const handlePreview = async () => {
    try {
      const template = settings.templates[activeTemplate] || defaultTemplates[activeTemplate];
      const res = await fetch(`${API_BASE}/reminders/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template })
      });
      const data = await res.json();
      setPreview(data.preview);
    } catch (error) {
      console.error('Error previewing:', error);
    }
  };

  const insertVariable = (variable) => {
    const textarea = document.getElementById(`template-${activeTemplate}`);
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentValue = settings.templates[activeTemplate] || defaultTemplates[activeTemplate] || '';
      const newValue = currentValue.substring(0, start) + variable + currentValue.substring(end);
      handleTemplateChange(activeTemplate, newValue);
    }
  };

  const handleSendReminder = async (rideId, customMessage) => {
    try {
      const body = customMessage 
        ? { custom_message: customMessage }
        : { template_type: 'five_minute' };

      await fetch(`${API_BASE}/reminders/send/${rideId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      // Refresh the list
      fetchData();
    } catch (error) {
      console.error('Error sending reminder:', error);
    }
  };

  const resetToDefault = () => {
    handleTemplateChange(activeTemplate, defaultTemplates[activeTemplate] || '');
  };

  const templateLabels = {
    five_minute: '5 Minutes Before',
    fifteen_minute: '15 Minutes Before',
    driver_arrived: 'Driver Arrived',
    driver_enroute: 'Driver En Route'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-stone-400">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* Header */}
      <header className="border-b border-stone-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a 
              href="/dashboard"
              className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition"
            >
              <Icons.ChevronLeft />
            </a>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
                <Icons.Bell />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Reminder Settings</h1>
                <p className="text-stone-500 text-sm">Configure automated guest notifications</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition ${
              saved 
                ? 'bg-emerald-600 text-white' 
                : 'bg-amber-600 hover:bg-amber-500 text-white'
            }`}
          >
            {saved ? (
              <><Icons.Check /> Saved</>
            ) : saving ? (
              'Saving...'
            ) : (
              <><Icons.Save /> Save Changes</>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Enable/Disable */}
            <div className="bg-stone-900 border border-stone-800 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-white mb-1">Automatic Reminders</h2>
                  <p className="text-sm text-stone-400">
                    Send SMS notifications to guests before their pickup time
                  </p>
                </div>
                <Toggle
                  enabled={settings.enabled}
                  onChange={(enabled) => setSettings(prev => ({ ...prev, enabled }))}
                />
              </div>

              {settings.enabled && (
                <div className="mt-6 pt-6 border-t border-stone-800">
                  <label className="block text-sm text-stone-400 mb-2">
                    Send reminder before pickup
                  </label>
                  <div className="flex items-center gap-3">
                    <select
                      value={settings.minutes_before}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        minutes_before: parseInt(e.target.value) 
                      }))}
                      className="bg-stone-800 border border-stone-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-600"
                    >
                      <option value={5}>5 minutes</option>
                      <option value={10}>10 minutes</option>
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                    </select>
                    <span className="text-stone-400">before scheduled pickup</span>
                  </div>
                </div>
              )}
            </div>

            {/* Message Templates */}
            <div className="bg-stone-900 border border-stone-800 rounded-xl p-6">
              <h2 className="text-lg font-medium text-white mb-4">Message Templates</h2>

              {/* Template Tabs */}
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(templateLabels).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setActiveTemplate(key)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition ${
                      activeTemplate === key
                        ? 'bg-amber-600 text-white'
                        : 'bg-stone-800 text-stone-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Variable Tags */}
              <div className="mb-3">
                <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
                  <Icons.Info />
                  <span>Click to insert variable:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {variables.map((v) => (
                    <VariableTag key={v.key} variable={v} onClick={insertVariable} />
                  ))}
                </div>
              </div>

              {/* Template Editor */}
              <textarea
                id={`template-${activeTemplate}`}
                value={settings.templates[activeTemplate] || defaultTemplates[activeTemplate] || ''}
                onChange={(e) => handleTemplateChange(activeTemplate, e.target.value)}
                rows={4}
                placeholder="Enter your message template..."
                className="w-full bg-stone-800 border border-stone-700 rounded-lg py-3 px-4 text-white placeholder-stone-500 focus:outline-none focus:border-amber-600 resize-none font-mono text-sm"
              />

              <div className="flex items-center justify-between mt-3">
                <button
                  onClick={resetToDefault}
                  className="text-sm text-stone-400 hover:text-white transition"
                >
                  Reset to default
                </button>
                <button
                  onClick={handlePreview}
                  className="flex items-center gap-2 text-sm text-amber-500 hover:text-amber-400 transition"
                >
                  <Icons.Eye /> Preview message
                </button>
              </div>

              {/* Preview */}
              {preview && (
                <div className="mt-4 p-4 bg-stone-800/50 rounded-lg border border-stone-700">
                  <div className="text-xs text-stone-500 mb-2">Preview:</div>
                  <div className="text-stone-200">{preview}</div>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Rides Sidebar */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-white">Upcoming Rides</h2>
              <span className="text-sm text-stone-400">Next 24 hours</span>
            </div>

            {upcomingRides.length === 0 ? (
              <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Icons.Clock />
                </div>
                <p className="text-stone-400">No upcoming rides</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingRides.map((ride) => (
                  <UpcomingRideCard
                    key={ride.id}
                    ride={ride}
                    onSendReminder={handleSendReminder}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
