import { query } from '../db.js';
import { sendSMS } from './sms.js';

// Default reminder templates
export const DEFAULT_TEMPLATES = {
  five_minute: "Your driver will arrive in 5 minutes at {pickup_location}. Please make your way to the pickup area.",
  fifteen_minute: "Reminder: Your ride is scheduled for {pickup_time}. Your driver will meet you at {pickup_location}.",
  driver_arrived: "Your driver has arrived and is waiting at {pickup_location}.",
  driver_enroute: "Your driver is on the way. Estimated arrival: {eta} minutes."
};

// Get hotel's custom reminder message or default
export async function getReminderTemplate(hotelId, templateType = 'five_minute') {
  try {
    const result = await query(
      `SELECT settings->'reminder_templates'->>$2 as template 
       FROM hotels WHERE id = $1`,
      [hotelId, templateType]
    );

    if (result.rows[0]?.template) {
      return result.rows[0].template;
    }

    return DEFAULT_TEMPLATES[templateType] || DEFAULT_TEMPLATES.five_minute;
  } catch (error) {
    console.error('Error fetching reminder template:', error);
    return DEFAULT_TEMPLATES[templateType] || DEFAULT_TEMPLATES.five_minute;
  }
}

// Save custom reminder template for hotel
export async function saveReminderTemplate(hotelId, templateType, template) {
  try {
    await query(
      `UPDATE hotels 
       SET settings = jsonb_set(
         COALESCE(settings, '{}'::jsonb),
         '{reminder_templates, ${templateType}}',
         $2::jsonb
       ),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [hotelId, JSON.stringify(template)]
    );
    return true;
  } catch (error) {
    console.error('Error saving reminder template:', error);
    throw error;
  }
}

// Get all reminder settings for a hotel
export async function getReminderSettings(hotelId) {
  try {
    const result = await query(
      `SELECT 
         COALESCE(settings->'reminder_templates', '{}'::jsonb) as templates,
         COALESCE(settings->'reminder_enabled', 'true'::jsonb) as enabled,
         COALESCE(settings->'reminder_minutes', '5'::jsonb) as minutes_before
       FROM hotels WHERE id = $1`,
      [hotelId]
    );

    if (result.rows.length === 0) {
      return {
        templates: DEFAULT_TEMPLATES,
        enabled: true,
        minutes_before: 5
      };
    }

    const row = result.rows[0];
    return {
      templates: {
        ...DEFAULT_TEMPLATES,
        ...(typeof row.templates === 'object' ? row.templates : {})
      },
      enabled: row.enabled !== false,
      minutes_before: parseInt(row.minutes_before) || 5
    };
  } catch (error) {
    console.error('Error fetching reminder settings:', error);
    return {
      templates: DEFAULT_TEMPLATES,
      enabled: true,
      minutes_before: 5
    };
  }
}

// Save all reminder settings
export async function saveReminderSettings(hotelId, settings) {
  try {
    await query(
      `UPDATE hotels 
       SET settings = COALESCE(settings, '{}'::jsonb) || $2::jsonb,
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [hotelId, JSON.stringify({
        reminder_templates: settings.templates,
        reminder_enabled: settings.enabled,
        reminder_minutes: settings.minutes_before
      })]
    );
    return true;
  } catch (error) {
    console.error('Error saving reminder settings:', error);
    throw error;
  }
}

// Replace template variables with actual values
export function formatReminderMessage(template, ride, guest) {
  const pickupTime = new Date(ride.pickup_time);
  
  const replacements = {
    '{guest_name}': guest?.name || 'Guest',
    '{pickup_location}': ride.pickup_location || 'the lobby',
    '{dropoff_location}': ride.dropoff_location || 'your destination',
    '{pickup_time}': pickupTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    }),
    '{pickup_date}': pickupTime.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    }),
    '{driver_name}': ride.driver_name || 'Your driver',
    '{room_number}': guest?.room_number || '',
    '{eta}': '5', // Can be dynamic based on actual tracking
    '{passenger_count}': ride.passenger_count || 1
  };

  let message = template;
  for (const [key, value] of Object.entries(replacements)) {
    message = message.replace(new RegExp(key, 'g'), value);
  }

  return message;
}

// Send reminder for a specific ride
export async function sendRideReminder(rideId, templateType = 'five_minute') {
  try {
    // Get ride with guest and hotel info
    const rideResult = await query(
      `SELECT r.*, 
         g.name as guest_name, g.phone as guest_phone, g.room_number,
         d.name as driver_name,
         h.settings as hotel_settings
       FROM rides r
       JOIN guests g ON r.guest_id = g.id
       LEFT JOIN drivers d ON r.driver_id = d.id
       JOIN hotels h ON r.hotel_id = h.id
       WHERE r.id = $1`,
      [rideId]
    );

    if (rideResult.rows.length === 0) {
      console.log(`Ride ${rideId} not found`);
      return false;
    }

    const ride = rideResult.rows[0];

    // Check if reminder already sent
    const reminderCheck = await query(
      `SELECT id FROM ride_reminders 
       WHERE ride_id = $1 AND reminder_type = $2`,
      [rideId, templateType]
    );

    if (reminderCheck.rows.length > 0) {
      console.log(`Reminder already sent for ride ${rideId}`);
      return false;
    }

    // Get template
    const template = await getReminderTemplate(ride.hotel_id, templateType);
    
    // Format message
    const message = formatReminderMessage(template, ride, {
      name: ride.guest_name,
      room_number: ride.room_number
    });

    // Send SMS
    await sendSMS(ride.guest_phone, message);

    // Log reminder
    await query(
      `INSERT INTO ride_reminders (ride_id, reminder_type, message_sent, sent_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
      [rideId, templateType, message]
    );

    console.log(`Reminder sent for ride ${rideId}: ${templateType}`);
    return true;
  } catch (error) {
    console.error(`Error sending reminder for ride ${rideId}:`, error);
    return false;
  }
}

// Find and send all due reminders
export async function processScheduledReminders() {
  try {
    // Get all hotels' reminder settings
    const hotelsResult = await query(
      `SELECT id, 
         COALESCE(settings->'reminder_enabled', 'true'::jsonb)::boolean as enabled,
         COALESCE((settings->>'reminder_minutes')::int, 5) as minutes_before
       FROM hotels
       WHERE COALESCE(settings->'reminder_enabled', 'true'::jsonb)::boolean = true`
    );

    for (const hotel of hotelsResult.rows) {
      // Find rides that need reminders
      const ridesResult = await query(
        `SELECT r.id
         FROM rides r
         LEFT JOIN ride_reminders rr ON r.id = rr.ride_id AND rr.reminder_type = 'five_minute'
         WHERE r.hotel_id = $1
           AND r.status IN ('scheduled', 'confirmed')
           AND r.pickup_time > NOW()
           AND r.pickup_time <= NOW() + interval '1 minute' * $2
           AND rr.id IS NULL`,
        [hotel.id, hotel.minutes_before]
      );

      for (const ride of ridesResult.rows) {
        await sendRideReminder(ride.id, 'five_minute');
      }
    }
  } catch (error) {
    console.error('Error processing scheduled reminders:', error);
  }
}

// Start the reminder scheduler
let reminderInterval = null;

export function startReminderScheduler(intervalMs = 60000) {
  if (reminderInterval) {
    clearInterval(reminderInterval);
  }

  console.log('🔔 Reminder scheduler started');
  
  // Run immediately on start
  processScheduledReminders();
  
  // Then run every minute
  reminderInterval = setInterval(processScheduledReminders, intervalMs);
  
  return reminderInterval;
}

export function stopReminderScheduler() {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
    console.log('🔔 Reminder scheduler stopped');
  }
}

export default {
  getReminderTemplate,
  saveReminderTemplate,
  getReminderSettings,
  saveReminderSettings,
  formatReminderMessage,
  sendRideReminder,
  processScheduledReminders,
  startReminderScheduler,
  stopReminderScheduler,
  DEFAULT_TEMPLATES
};
