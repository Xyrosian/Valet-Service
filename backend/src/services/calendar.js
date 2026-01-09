import { google } from 'googleapis';
import { query } from '../db.js';
import dotenv from 'dotenv';

dotenv.config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Generate OAuth URL for driver to connect calendar
export function getAuthUrl(driverId) {
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: driverId, // Pass driver ID through OAuth flow
    prompt: 'consent' // Force consent to get refresh token
  });
}

// Handle OAuth callback and save tokens
export async function handleCallback(code, driverId) {
  const { tokens } = await oauth2Client.getToken(code);
  
  // Save refresh token to driver record
  await query(
    'UPDATE drivers SET google_refresh_token = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [tokens.refresh_token, driverId]
  );

  // Get calendar ID (primary calendar)
  oauth2Client.setCredentials(tokens);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  const calendarList = await calendar.calendarList.list();
  const primaryCalendar = calendarList.data.items.find(c => c.primary);
  
  if (primaryCalendar) {
    await query(
      'UPDATE drivers SET google_calendar_id = $1 WHERE id = $2',
      [primaryCalendar.id, driverId]
    );
  }

  return tokens;
}

// Get authenticated calendar client for a driver
async function getDriverCalendar(driverId) {
  const result = await query(
    'SELECT google_refresh_token, google_calendar_id FROM drivers WHERE id = $1',
    [driverId]
  );

  if (!result.rows[0]?.google_refresh_token) {
    throw new Error('Driver calendar not connected');
  }

  const driver = result.rows[0];
  
  oauth2Client.setCredentials({
    refresh_token: driver.google_refresh_token
  });

  return {
    calendar: google.calendar({ version: 'v3', auth: oauth2Client }),
    calendarId: driver.google_calendar_id || 'primary'
  };
}

// Sync ride to driver's calendar
export async function syncRideToCalendar(ride) {
  if (!ride.driver_id) return;

  try {
    const { calendar, calendarId } = await getDriverCalendar(ride.driver_id);

    // Get guest info for event details
    const guestResult = await query(
      'SELECT name, phone, room_number FROM guests WHERE id = $1',
      [ride.guest_id]
    );
    const guest = guestResult.rows[0];

    const pickupTime = new Date(ride.pickup_time);
    // Estimate 1 hour for ride duration (could be smarter with distance API)
    const endTime = new Date(pickupTime.getTime() + 60 * 60 * 1000);

    const event = {
      summary: `🚗 ${guest?.name || 'Guest'} - Valet Pickup`,
      description: `
Guest: ${guest?.name || 'Unknown'}
Phone: ${guest?.phone || 'N/A'}
Room: ${guest?.room_number || 'N/A'}

Pickup: ${ride.pickup_location}
Destination: ${ride.dropoff_location}

Passengers: ${ride.passenger_count || 1}
${ride.special_requests ? `Special Requests: ${ride.special_requests}` : ''}
${ride.pickup_notes ? `Pickup Notes: ${ride.pickup_notes}` : ''}
      `.trim(),
      start: {
        dateTime: pickupTime.toISOString(),
        timeZone: 'America/New_York' // Could be dynamic per hotel
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'America/New_York'
      },
      location: ride.pickup_location,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
          { method: 'popup', minutes: 15 }
        ]
      },
      colorId: '9' // Blue color for valet rides
    };

    let calendarEventId;

    if (ride.calendar_event_id) {
      // Update existing event
      const response = await calendar.events.update({
        calendarId,
        eventId: ride.calendar_event_id,
        resource: event
      });
      calendarEventId = response.data.id;
    } else {
      // Create new event
      const response = await calendar.events.insert({
        calendarId,
        resource: event
      });
      calendarEventId = response.data.id;

      // Save event ID to ride
      await query(
        'UPDATE rides SET calendar_event_id = $1 WHERE id = $2',
        [calendarEventId, ride.id]
      );
    }

    console.log(`Calendar synced for ride ${ride.id}: ${calendarEventId}`);
    return calendarEventId;
  } catch (error) {
    console.error('Calendar sync error:', error);
    throw error;
  }
}

// Delete calendar event
export async function deleteCalendarEvent(ride) {
  if (!ride.driver_id || !ride.calendar_event_id) return;

  try {
    const { calendar, calendarId } = await getDriverCalendar(ride.driver_id);

    await calendar.events.delete({
      calendarId,
      eventId: ride.calendar_event_id
    });

    console.log(`Calendar event deleted for ride ${ride.id}`);
  } catch (error) {
    console.error('Calendar delete error:', error);
    throw error;
  }
}

// Get driver's schedule from calendar
export async function getDriverSchedule(driverId, startDate, endDate) {
  try {
    const { calendar, calendarId } = await getDriverCalendar(driverId);

    const response = await calendar.events.list({
      calendarId,
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });

    return response.data.items;
  } catch (error) {
    console.error('Get schedule error:', error);
    throw error;
  }
}

export default {
  getAuthUrl,
  handleCallback,
  syncRideToCalendar,
  deleteCalendarEvent,
  getDriverSchedule
};
