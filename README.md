# Luxury Valet Scheduling Service

A seamless valet car scheduling service for luxury hotels with bespoke drivers.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        GUEST FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│  1. Guest receives link (QR, email, concierge)                  │
│  2. One-time web form: details + first pickup                   │
│  3. All future interactions via SMS                             │
│     - AI handles common questions                               │
│     - Complex requests routed to driver                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      SYSTEM COMPONENTS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Guest      │    │   Hotel      │    │   Driver     │       │
│  │   Web Form   │    │   Dashboard  │    │   Calendar   │       │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘       │
│         │                   │                   │                │
│         └─────────┬─────────┴─────────┬─────────┘                │
│                   │                   │                          │
│                   ▼                   ▼                          │
│         ┌──────────────────────────────────┐                    │
│         │          Backend API             │                    │
│         │   - Booking management           │                    │
│         │   - SMS routing (Twilio)         │                    │
│         │   - AI message parsing           │                    │
│         │   - Calendar sync                │                    │
│         └──────────────────────────────────┘                    │
│                         │                                        │
│                         ▼                                        │
│         ┌──────────────────────────────────┐                    │
│         │          Database                │                    │
│         │   - Guests, Drivers, Rides       │                    │
│         │   - Hotels, Messages             │                    │
│         └──────────────────────────────────┘                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Frontend**: React + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (or SQLite for development)
- **SMS**: Twilio
- **AI**: Anthropic Claude API for message parsing
- **Calendar**: Google Calendar API

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in `/backend`:

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/valet

# Twilio
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890

# Anthropic (for AI SMS parsing)
ANTHROPIC_API_KEY=your_key

# Google Calendar
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# App
PORT=3000
JWT_SECRET=your_jwt_secret
```

### 2. Install Dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. Run Development

```bash
# Backend
cd backend && npm run dev

# Frontend (separate terminal)
cd frontend && npm run dev
```

## API Endpoints

### Guests
- `POST /api/guests` - Register new guest
- `GET /api/guests/:id` - Get guest details

### Rides
- `POST /api/rides` - Schedule new ride
- `GET /api/rides` - List rides (filtered by hotel/driver/date)
- `PATCH /api/rides/:id` - Update ride
- `DELETE /api/rides/:id` - Cancel ride

### SMS Webhook
- `POST /api/sms/incoming` - Twilio webhook for incoming SMS

### Calendar
- `GET /api/calendar/sync` - Sync rides to driver calendar
- `POST /api/calendar/connect` - OAuth flow for driver calendar

### Hotel Dashboard
- `GET /api/hotels/:id/rides` - All rides for hotel
- `POST /api/hotels/:id/rides` - Staff books ride for guest
