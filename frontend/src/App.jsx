import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import GuestBooking from './pages/GuestBooking';
import HotelDashboard from './pages/HotelDashboard';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import ReminderSettings from './pages/ReminderSettings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Guest booking page - accessed via link/QR */}
        <Route path="/book" element={<GuestBooking />} />
        
        {/* Hotel staff dashboard */}
        <Route path="/dashboard" element={<HotelDashboard />} />
        
        {/* Analytics dashboard */}
        <Route path="/analytics" element={<AnalyticsDashboard />} />
        
        {/* Reminder settings */}
        <Route path="/settings/reminders" element={<ReminderSettings />} />
        
        {/* Default redirect to dashboard for demo */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
