import express from 'express';
import { query } from '../db.js';
import { parseMessage, generateResponse, sendSMS, formatDriverNotification } from '../services/sms.js';

const router = express.Router();

// Twilio webhook for incoming SMS
router.post('/incoming', async (req, res) => {
  try {
    const { From: fromNumber, Body: messageBody, MessageSid: twilioSid } = req.body;

    console.log(`Incoming SMS from ${fromNumber}: ${messageBody}`);

    // Normalize phone number
    const normalizedPhone = normalizePhone(fromNumber);

    // Find guest by phone
    const guestResult = await query(
      `SELECT g.*, h.name as hotel_name 
       FROM guests g 
       LEFT JOIN hotels h ON g.hotel_id = h.id
       WHERE g.phone = $1 
       ORDER BY g.created_at DESC LIMIT 1`,
      [normalizedPhone]
    );

    if (guestResult.rows.length === 0) {
      // Unknown number - send helpful response
      await sendSMS(fromNumber, 
        "Welcome to our valet service. It looks like you're not registered yet. " +
        "Please speak with your hotel concierge to get started."
      );
      return res.status(200).send('<Response></Response>');
    }

    const guest = guestResult.rows[0];

    // Get upcoming ride for context
    const rideResult = await query(
      `SELECT r.*, d.name as driver_name, d.phone as driver_phone
       FROM rides r
       LEFT JOIN drivers d ON r.driver_id = d.id
       WHERE r.guest_id = $1 
         AND r.status NOT IN ('completed', 'cancelled')
       ORDER BY r.pickup_time ASC LIMIT 1`,
      [guest.id]
    );

    const ride = rideResult.rows[0] || null;

    // Parse message with AI
    const parsed = await parseMessage(messageBody, guest, ride);

    console.log('Parsed intent:', parsed);

    // Log message to database
    await query(
      `INSERT INTO messages (guest_id, driver_id, ride_id, direction, from_number, 
        to_number, body, ai_handled, ai_intent, ai_confidence, twilio_sid)
       VALUES ($1, $2, $3, 'inbound', $4, $5, $6, $7, $8, $9, $10)`,
      [guest.id, ride?.driver_id, ride?.id, fromNumber, process.env.TWILIO_PHONE_NUMBER,
       messageBody, !parsed.needs_human, parsed.intent, parsed.confidence, twilioSid]
    );

    // Handle different intents
    let response;

    switch (parsed.intent) {
      case 'schedule_change':
        if (ride && parsed.extracted_data?.new_time) {
          // Update the ride time
          await query(
            'UPDATE rides SET pickup_time = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [parsed.extracted_data.new_time, ride.id]
          );
          response = `Your ride has been rescheduled to ${new Date(parsed.extracted_data.new_time).toLocaleString('en-US', {
            weekday: 'short',
            month: 'short', 
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })}. See you then.`;
        } else if (ride && parsed.extracted_data?.time_adjustment) {
          // Handle relative time changes like "+30 minutes"
          const adjustment = parseTimeAdjustment(parsed.extracted_data.time_adjustment);
          if (adjustment) {
            const newTime = new Date(new Date(ride.pickup_time).getTime() + adjustment);
            await query(
              'UPDATE rides SET pickup_time = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
              [newTime.toISOString(), ride.id]
            );
            response = `Your ride has been moved to ${newTime.toLocaleString('en-US', {
              hour: 'numeric',
              minute: '2-digit'
            })}. See you then.`;
          } else {
            response = parsed.suggested_response || "I'd be happy to adjust your pickup time. What time works better for you?";
          }
        } else {
          response = parsed.suggested_response || "I'd be happy to adjust your pickup time. What time works better for you?";
        }
        break;

      case 'cancel':
        if (ride) {
          await query(
            "UPDATE rides SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
            [ride.id]
          );
        }
        response = "Your ride has been cancelled. Just text back whenever you'd like to schedule another.";
        break;

      case 'driver_contact':
        // Forward to driver and notify guest
        if (ride?.driver_phone) {
          await sendSMS(
            ride.driver_phone,
            formatDriverNotification(guest, ride, messageBody, parsed)
          );
          response = "I've notified your driver. They'll respond shortly.";
        } else {
          response = "I'll have someone from our team reach out to you shortly.";
        }
        break;

      default:
        // Use AI-generated response or escalate
        if (parsed.needs_human && ride?.driver_phone) {
          await sendSMS(
            ride.driver_phone,
            formatDriverNotification(guest, ride, messageBody, parsed)
          );
          response = parsed.suggested_response || "I've forwarded your message to your driver.";
        } else {
          response = parsed.suggested_response || await generateResponse(parsed.intent, guest, ride, parsed.extracted_data);
        }
    }

    // Send response to guest
    await sendSMS(fromNumber, response);

    // Log outbound message
    await query(
      `INSERT INTO messages (guest_id, driver_id, ride_id, direction, from_number, 
        to_number, body, ai_handled, ai_intent)
       VALUES ($1, $2, $3, 'outbound', $4, $5, $6, true, $7)`,
      [guest.id, ride?.driver_id, ride?.id, process.env.TWILIO_PHONE_NUMBER,
       fromNumber, response, parsed.intent]
    );

    // Return empty TwiML (we're sending via API, not TwiML response)
    res.type('text/xml').send('<Response></Response>');
  } catch (error) {
    console.error('SMS webhook error:', error);
    res.status(500).send('<Response></Response>');
  }
});

// Driver incoming SMS (for when drivers text the system)
router.post('/driver', async (req, res) => {
  try {
    const { From: fromNumber, Body: messageBody } = req.body;
    const normalizedPhone = normalizePhone(fromNumber);

    // Find driver
    const driverResult = await query(
      'SELECT * FROM drivers WHERE phone = $1',
      [normalizedPhone]
    );

    if (driverResult.rows.length === 0) {
      return res.type('text/xml').send('<Response></Response>');
    }

    const driver = driverResult.rows[0];

    // Get their most recent active ride
    const rideResult = await query(
      `SELECT r.*, g.name as guest_name, g.phone as guest_phone
       FROM rides r
       JOIN guests g ON r.guest_id = g.id
       WHERE r.driver_id = $1 AND r.status IN ('scheduled', 'confirmed', 'in_progress')
       ORDER BY r.pickup_time ASC LIMIT 1`,
      [driver.id]
    );

    if (rideResult.rows.length > 0) {
      const ride = rideResult.rows[0];
      // Forward message to guest
      await sendSMS(
        ride.guest_phone,
        `From your driver: ${messageBody}`
      );
    }

    res.type('text/xml').send('<Response></Response>');
  } catch (error) {
    console.error('Driver SMS error:', error);
    res.status(500).send('<Response></Response>');
  }
});

// Get message history for a guest
router.get('/history/:guestId', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM messages 
       WHERE guest_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [req.params.guestId]
    );
    res.json({ messages: result.rows });
  } catch (error) {
    console.error('Error fetching message history:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Helper functions
function normalizePhone(phone) {
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 10) digits = '1' + digits;
  return '+' + digits;
}

function parseTimeAdjustment(adjustment) {
  // Parse strings like "+30 minutes", "-1 hour", "30 min later"
  const match = adjustment.match(/([+-]?\d+)\s*(min|minute|hour|hr)/i);
  if (!match) return null;
  
  let value = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  
  // Handle "later" or implied positive
  if (adjustment.toLowerCase().includes('later') && value > 0) {
    // Already positive
  } else if (adjustment.toLowerCase().includes('earlier') && value > 0) {
    value = -value;
  }
  
  if (unit.startsWith('hour') || unit === 'hr') {
    return value * 60 * 60 * 1000;
  }
  return value * 60 * 1000;
}

export default router;
