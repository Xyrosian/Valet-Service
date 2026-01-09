-- Luxury Valet Scheduling Service - Database Schema

-- Hotels table
CREATE TABLE hotels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Drivers table
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255),
    hotel_id UUID REFERENCES hotels(id),
    vehicle_info JSONB DEFAULT '{}', -- make, model, color, plate
    google_calendar_id VARCHAR(255),
    google_refresh_token TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Guests table
CREATE TABLE guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    hotel_id UUID REFERENCES hotels(id),
    room_number VARCHAR(50),
    check_in_date DATE,
    check_out_date DATE,
    preferences JSONB DEFAULT '{}', -- temperature, music, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for phone lookups (SMS routing)
CREATE INDEX idx_guests_phone ON guests(phone);

-- Rides table
CREATE TABLE rides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_id UUID REFERENCES guests(id) NOT NULL,
    driver_id UUID REFERENCES drivers(id),
    hotel_id UUID REFERENCES hotels(id) NOT NULL,
    
    -- Pickup details
    pickup_time TIMESTAMP NOT NULL,
    pickup_location TEXT NOT NULL,
    pickup_notes TEXT,
    
    -- Dropoff details
    dropoff_location TEXT NOT NULL,
    dropoff_notes TEXT,
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, confirmed, in_progress, completed, cancelled
    
    -- Timing
    driver_departed_at TIMESTAMP,
    guest_picked_up_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Distance tracking
    miles_driven DECIMAL(10, 2),
    
    -- Google Calendar event ID (for sync)
    calendar_event_id VARCHAR(255),
    
    -- Additional info
    passenger_count INTEGER DEFAULT 1,
    special_requests TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) DEFAULT 'guest' -- guest, hotel_staff, system
);

-- Create indexes for common queries
CREATE INDEX idx_rides_pickup_time ON rides(pickup_time);
CREATE INDEX idx_rides_driver_id ON rides(driver_id);
CREATE INDEX idx_rides_hotel_id ON rides(hotel_id);
CREATE INDEX idx_rides_status ON rides(status);

-- Messages table (SMS log)
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_id UUID REFERENCES guests(id),
    driver_id UUID REFERENCES drivers(id),
    ride_id UUID REFERENCES rides(id),
    
    direction VARCHAR(10) NOT NULL, -- inbound, outbound
    from_number VARCHAR(50) NOT NULL,
    to_number VARCHAR(50) NOT NULL,
    body TEXT NOT NULL,
    
    -- AI processing
    ai_handled BOOLEAN DEFAULT false,
    ai_intent VARCHAR(100), -- schedule_change, question, confirmation, etc.
    ai_confidence FLOAT,
    
    -- Twilio metadata
    twilio_sid VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_guest_id ON messages(guest_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Ride reminders tracking table
CREATE TABLE ride_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID REFERENCES rides(id) NOT NULL,
    reminder_type VARCHAR(50) NOT NULL, -- five_minute, fifteen_minute, driver_arrived, manual
    message_sent TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(ride_id, reminder_type)
);

CREATE INDEX idx_ride_reminders_ride_id ON ride_reminders(ride_id);
CREATE INDEX idx_ride_reminders_sent_at ON ride_reminders(sent_at);

-- Hotel staff users
CREATE TABLE hotel_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID REFERENCES hotels(id) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'concierge', -- concierge, manager, admin
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hotels_updated_at BEFORE UPDATE ON hotels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON guests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rides_updated_at BEFORE UPDATE ON rides
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hotel_staff_updated_at BEFORE UPDATE ON hotel_staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
