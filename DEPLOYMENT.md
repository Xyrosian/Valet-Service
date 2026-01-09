# Deployment Guide

## Quick Start (Local Development)

### 1. Database Setup

```bash
# Create PostgreSQL database
createdb valet_service

# Run schema
cd backend
psql valet_service < schema.sql
```

### 2. Environment Variables

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
```

### 3. Install & Run

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### 4. Access the App

- **Hotel Dashboard**: http://localhost:5173/dashboard
- **Guest Booking**: http://localhost:5173/book?hotel=YOUR_HOTEL_ID

---

## External Service Setup

### Twilio (SMS)

1. Create account at https://www.twilio.com
2. Get a phone number with SMS capability
3. Set up webhook for incoming SMS:
   - URL: `https://your-domain.com/api/sms/incoming`
   - Method: POST
4. Copy Account SID, Auth Token, and Phone Number to `.env`

### Google Calendar API

1. Go to https://console.cloud.google.com
2. Create a new project
3. Enable "Google Calendar API"
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URI: `https://your-domain.com/api/calendar/callback`
6. Copy Client ID and Client Secret to `.env`

### Anthropic API

1. Get API key from https://console.anthropic.com
2. Add to `.env` as `ANTHROPIC_API_KEY`

---

## Production Deployment

### Railway / Render / Fly.io

1. Push to GitHub
2. Connect repo to hosting platform
3. Set environment variables
4. Deploy backend first, then frontend

### Database

Use a managed PostgreSQL service:
- Railway PostgreSQL
- Supabase
- Neon
- PlanetScale (with adapter)

### Recommended Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   Cloudflare    │────▶│    Frontend     │
│   (CDN/DNS)     │     │  (Vercel/CF)    │
└─────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │    Backend      │
                        │ (Railway/Fly)   │
                        └─────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
        ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
        │  PostgreSQL │ │   Twilio    │ │   Google    │
        │  (Managed)  │ │    SMS      │ │  Calendar   │
        └─────────────┘ └─────────────┘ └─────────────┘
```

---

## Creating Your First Hotel

```bash
# Connect to database and run:
INSERT INTO hotels (name, address, timezone) 
VALUES ('Grand Luxe Hotel', '123 Park Avenue, New York', 'America/New_York')
RETURNING id;

# Use the returned ID for guest booking links:
# https://your-app.com/book?hotel=<hotel-id>
```

---

## Creating a Driver

```bash
# Via API:
curl -X POST http://localhost:3000/api/hotels/<hotel-id>/drivers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "James Wilson",
    "phone": "+15551234567",
    "email": "james@example.com",
    "vehicle_info": {
      "make": "Mercedes",
      "model": "S-Class",
      "year": 2024,
      "color": "Black",
      "plate": "LUX-001"
    }
  }'
```

---

## Connecting Driver Calendar

1. Driver visits: `https://your-app.com/api/calendar/connect/<driver-id>`
2. Completes Google OAuth flow
3. Rides automatically sync to their calendar

---

## SMS Flow Testing

1. Register as a guest via the booking page
2. Schedule a ride
3. Text the Twilio number with messages like:
   - "What time is my pickup?"
   - "Can you push it back 30 minutes?"
   - "Cancel my ride"
   - "Where am I being picked up?"

---

## Customization

### Adding More AI Intents

Edit `backend/src/services/sms.js`:

```javascript
// In parseMessage function, add new intents to the system prompt
// In generateResponse function, add response handlers
```

### Custom Branding

Edit frontend components:
- Colors: Update Tailwind config and component classes
- Logo: Replace in `HotelDashboard.jsx` header
- Fonts: Update `index.html` and Tailwind config

### Multi-Hotel Support

The system already supports multiple hotels. Each hotel:
- Has unique ID
- Has own drivers
- Has own guests
- Has own dashboard (add auth to filter)
