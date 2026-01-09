import express from 'express';
import { query } from '../db.js';
import { 
  getReminderSettings, 
  saveReminderSettings, 
  sendRideReminder,
  formatReminderMessage,
  DEFAULT_TEMPLATES 
} from '../services/reminders.js';

const router = express.Router();

// Get reminder settings for a hotel
router.get('/hotel/:hotelId/settings', async (req, res) => {
  try {
    const settings = await getReminderSettings(req.params.hotelId);
    res.json({ settings });
  } catch (error) {
    console.error('Error fetching reminder settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update reminder settings for a hotel
router.put('/hotel/:hotelId/settings', async (req, res) => {
  try {
    const { templates, enabled, minutes_before } = req.body;
    
    await saveReminderSettings(req.params.hotelId, {
      templates: templates || DEFAULT_TEMPLATES,
      enabled: enabled !== false,
      minutes_before: minutes_before || 5
    });

    res.json({ message: 'Settings saved successfully' });
  } catch (error) {
    console.error('Error saving reminder settings:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// Preview a reminder message (without sending)
router.post('/preview', async (req, res) => {
  try {
    const { template, ride_id } = req.body;

    if (ride_id) {
      // Get actual ride data for preview
      const rideResult = await query(
        `SELECT r.*, g.name as guest_name, g.room_number, d.name as driver_name
         FROM rides r
         JOIN guests g ON r.guest_id = g.id
         LEFT JOIN drivers d ON r.driver_id = d.id
         WHERE r.id = $1`,
        [ride_id]
      );

      if (rideResult.rows.length > 0) {
        const ride = rideResult.rows[0];
        const message = formatReminderMessage(template, ride, {
          name: ride.guest_name,
          room_number: ride.room_number
        });
        return res.json({ preview: message });
      }
    }

    // Use sample data for preview
    const sampleRide = {
      pickup_time: new Date(Date.now() + 5 * 60000),
      pickup_location: 'Hotel Lobby',
      dropoff_location: 'Airport Terminal 1',
      driver_name: 'James',
      passenger_count: 2
    };
    const sampleGuest = {
      name: 'John Smith',
      room_number: '1204'
    };

    const message = formatReminderMessage(template, sampleRide, sampleGuest);
    res.json({ preview: message });
  } catch (error) {
    console.error('Error previewing reminder:', error);
    res.status(500).json({ error: 'Failed to preview message' });
  }
});

// Manually send a reminder for a specific ride
router.post('/send/:rideId', async (req, res) => {
  try {
    const { template_type = 'five_minute', custom_message } = req.body;
    
    if (custom_message) {
      // Send custom message directly
      const rideResult = await query(
        `SELECT r.*, g.phone as guest_phone, g.name as guest_name, g.room_number
         FROM rides r
         JOIN guests g ON r.guest_id = g.id
         WHERE r.id = $1`,
        [req.params.rideId]
      );

      if (rideResult.rows.length === 0) {
        return res.status(404).json({ error: 'Ride not found' });
      }

      const ride = rideResult.rows[0];
      const { sendSMS } = await import('../services/sms.js');
      
      // Format the custom message with variables
      const formattedMessage = formatReminderMessage(custom_message, ride, {
        name: ride.guest_name,
        room_number: ride.room_number
      });

      await sendSMS(ride.guest_phone, formattedMessage);

      // Log the reminder
      await query(
        `INSERT INTO ride_reminders (ride_id, reminder_type, message_sent, sent_at)
         VALUES ($1, 'manual', $2, CURRENT_TIMESTAMP)`,
        [req.params.rideId, formattedMessage]
      );

      return res.json({ message: 'Reminder sent successfully', sent_message: formattedMessage });
    }

    // Use template-based reminder
    const success = await sendRideReminder(req.params.rideId, template_type);
    
    if (success) {
      res.json({ message: 'Reminder sent successfully' });
    } else {
      res.status(400).json({ error: 'Failed to send reminder (may have already been sent)' });
    }
  } catch (error) {
    console.error('Error sending reminder:', error);
    res.status(500).json({ error: 'Failed to send reminder' });
  }
});

// Get reminder history for a ride
router.get('/ride/:rideId/history', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM ride_reminders 
       WHERE ride_id = $1 
       ORDER BY sent_at DESC`,
      [req.params.rideId]
    );
    res.json({ reminders: result.rows });
  } catch (error) {
    console.error('Error fetching reminder history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Get all pending reminders for a hotel (upcoming rides without reminders)
router.get('/hotel/:hotelId/pending', async (req, res) => {
  try {
    const settings = await getReminderSettings(req.params.hotelId);
    
    const result = await query(
      `SELECT r.id, r.pickup_time, r.pickup_location, r.dropoff_location,
         g.name as guest_name, g.phone as guest_phone, g.room_number,
         d.name as driver_name,
         CASE WHEN rr.id IS NOT NULL THEN true ELSE false END as reminder_sent
       FROM rides r
       JOIN guests g ON r.guest_id = g.id
       LEFT JOIN drivers d ON r.driver_id = d.id
       LEFT JOIN ride_reminders rr ON r.id = rr.ride_id AND rr.reminder_type = 'five_minute'
       WHERE r.hotel_id = $1
         AND r.status IN ('scheduled', 'confirmed')
         AND r.pickup_time > NOW()
         AND r.pickup_time <= NOW() + interval '24 hours'
       ORDER BY r.pickup_time ASC`,
      [req.params.hotelId]
    );

    res.json({ 
      rides: result.rows,
      settings: {
        enabled: settings.enabled,
        minutes_before: settings.minutes_before
      }
    });
  } catch (error) {
    console.error('Error fetching pending reminders:', error);
    res.status(500).json({ error: 'Failed to fetch pending reminders' });
  }
});

// Get available template variables
router.get('/variables', (req, res) => {
  res.json({
    variables: [
      { key: '{guest_name}', description: 'Guest\'s full name' },
      { key: '{pickup_location}', description: 'Pickup location' },
      { key: '{dropoff_location}', description: 'Destination' },
      { key: '{pickup_time}', description: 'Scheduled pickup time' },
      { key: '{pickup_date}', description: 'Scheduled pickup date' },
      { key: '{driver_name}', description: 'Assigned driver\'s name' },
      { key: '{room_number}', description: 'Guest\'s room number' },
      { key: '{eta}', description: 'Estimated time of arrival' },
      { key: '{passenger_count}', description: 'Number of passengers' }
    ],
    default_templates: DEFAULT_TEMPLATES
  });
});

export default router;
