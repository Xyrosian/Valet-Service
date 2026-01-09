import express from 'express';
import { query } from '../db.js';
import { syncRideToCalendar, deleteCalendarEvent } from '../services/calendar.js';
import { sendSMS } from '../services/sms.js';

const router = express.Router();

// Create new ride
router.post('/', async (req, res) => {
  try {
    const {
      guest_id,
      driver_id,
      hotel_id,
      pickup_time,
      pickup_location,
      pickup_notes,
      dropoff_location,
      dropoff_notes,
      passenger_count,
      special_requests,
      created_by = 'guest'
    } = req.body;

    // Validate required fields
    if (!guest_id || !hotel_id || !pickup_time || !pickup_location || !dropoff_location) {
      return res.status(400).json({
        error: 'Missing required fields: guest_id, hotel_id, pickup_time, pickup_location, dropoff_location'
      });
    }

    // If no driver specified, assign one (could be smarter with availability)
    let assignedDriverId = driver_id;
    if (!assignedDriverId) {
      const availableDriver = await query(
        'SELECT id FROM drivers WHERE hotel_id = $1 AND is_active = true LIMIT 1',
        [hotel_id]
      );
      if (availableDriver.rows.length > 0) {
        assignedDriverId = availableDriver.rows[0].id;
      }
    }

    const result = await query(
      `INSERT INTO rides (
        guest_id, driver_id, hotel_id, pickup_time, pickup_location,
        pickup_notes, dropoff_location, dropoff_notes, passenger_count,
        special_requests, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [guest_id, assignedDriverId, hotel_id, pickup_time, pickup_location,
       pickup_notes, dropoff_location, dropoff_notes, passenger_count || 1,
       special_requests, created_by]
    );

    const ride = result.rows[0];

    // Sync to driver's Google Calendar if connected
    if (assignedDriverId) {
      try {
        await syncRideToCalendar(ride);
      } catch (calError) {
        console.error('Calendar sync failed:', calError);
        // Don't fail the request, calendar is non-critical
      }
    }

    // Get guest info for SMS confirmation
    const guestResult = await query('SELECT * FROM guests WHERE id = $1', [guest_id]);
    if (guestResult.rows.length > 0) {
      const guest = guestResult.rows[0];
      const pickupDate = new Date(pickup_time);
      const formattedTime = pickupDate.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });

      await sendSMS(
        guest.phone,
        `Your ride is confirmed for ${formattedTime}.\n\n` +
        `Pickup: ${pickup_location}\n` +
        `Destination: ${dropoff_location}\n\n` +
        `Reply to this number anytime to make changes or ask questions.`
      );
    }

    res.status(201).json({ ride });
  } catch (error) {
    console.error('Error creating ride:', error);
    res.status(500).json({ error: 'Failed to create ride' });
  }
});

// Get rides with filters
router.get('/', async (req, res) => {
  try {
    const { hotel_id, driver_id, guest_id, status, date, start_date, end_date } = req.query;
    
    let sql = `
      SELECT r.*, 
        g.name as guest_name, g.phone as guest_phone, g.room_number,
        d.name as driver_name, d.phone as driver_phone
      FROM rides r
      LEFT JOIN guests g ON r.guest_id = g.id
      LEFT JOIN drivers d ON r.driver_id = d.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (hotel_id) {
      sql += ` AND r.hotel_id = $${paramIndex++}`;
      params.push(hotel_id);
    }
    if (driver_id) {
      sql += ` AND r.driver_id = $${paramIndex++}`;
      params.push(driver_id);
    }
    if (guest_id) {
      sql += ` AND r.guest_id = $${paramIndex++}`;
      params.push(guest_id);
    }
    if (status) {
      sql += ` AND r.status = $${paramIndex++}`;
      params.push(status);
    }
    if (date) {
      sql += ` AND DATE(r.pickup_time) = $${paramIndex++}`;
      params.push(date);
    }
    if (start_date && end_date) {
      sql += ` AND r.pickup_time BETWEEN $${paramIndex++} AND $${paramIndex++}`;
      params.push(start_date, end_date);
    }

    sql += ' ORDER BY r.pickup_time ASC';

    const result = await query(sql, params);
    res.json({ rides: result.rows });
  } catch (error) {
    console.error('Error fetching rides:', error);
    res.status(500).json({ error: 'Failed to fetch rides' });
  }
});

// Get single ride
router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT r.*, 
        g.name as guest_name, g.phone as guest_phone, g.room_number,
        d.name as driver_name, d.phone as driver_phone
      FROM rides r
      LEFT JOIN guests g ON r.guest_id = g.id
      LEFT JOIN drivers d ON r.driver_id = d.id
      WHERE r.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    res.json({ ride: result.rows[0] });
  } catch (error) {
    console.error('Error fetching ride:', error);
    res.status(500).json({ error: 'Failed to fetch ride' });
  }
});

// Update ride
router.patch('/:id', async (req, res) => {
  try {
    const {
      pickup_time,
      pickup_location,
      pickup_notes,
      dropoff_location,
      dropoff_notes,
      status,
      driver_id,
      passenger_count,
      special_requests
    } = req.body;

    // Build dynamic update query
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (pickup_time !== undefined) {
      updates.push(`pickup_time = $${paramIndex++}`);
      params.push(pickup_time);
    }
    if (pickup_location !== undefined) {
      updates.push(`pickup_location = $${paramIndex++}`);
      params.push(pickup_location);
    }
    if (pickup_notes !== undefined) {
      updates.push(`pickup_notes = $${paramIndex++}`);
      params.push(pickup_notes);
    }
    if (dropoff_location !== undefined) {
      updates.push(`dropoff_location = $${paramIndex++}`);
      params.push(dropoff_location);
    }
    if (dropoff_notes !== undefined) {
      updates.push(`dropoff_notes = $${paramIndex++}`);
      params.push(dropoff_notes);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(status);

      // Track status timestamps
      if (status === 'in_progress') {
        updates.push(`driver_departed_at = CURRENT_TIMESTAMP`);
      } else if (status === 'completed') {
        updates.push(`completed_at = CURRENT_TIMESTAMP`);
      }
    }
    if (driver_id !== undefined) {
      updates.push(`driver_id = $${paramIndex++}`);
      params.push(driver_id);
    }
    if (passenger_count !== undefined) {
      updates.push(`passenger_count = $${paramIndex++}`);
      params.push(passenger_count);
    }
    if (special_requests !== undefined) {
      updates.push(`special_requests = $${paramIndex++}`);
      params.push(special_requests);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.params.id);

    const result = await query(
      `UPDATE rides SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    const ride = result.rows[0];

    // Sync calendar update
    if (ride.driver_id) {
      try {
        await syncRideToCalendar(ride);
      } catch (calError) {
        console.error('Calendar sync failed:', calError);
      }
    }

    // Notify guest of changes if time changed
    if (pickup_time) {
      const guestResult = await query('SELECT * FROM guests WHERE id = $1', [ride.guest_id]);
      if (guestResult.rows.length > 0) {
        const guest = guestResult.rows[0];
        const pickupDate = new Date(pickup_time);
        const formattedTime = pickupDate.toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        });

        await sendSMS(
          guest.phone,
          `Your ride has been updated. New pickup time: ${formattedTime}`
        );
      }
    }

    res.json({ ride });
  } catch (error) {
    console.error('Error updating ride:', error);
    res.status(500).json({ error: 'Failed to update ride' });
  }
});

// Cancel ride
router.delete('/:id', async (req, res) => {
  try {
    // Get ride first for calendar cleanup
    const existing = await query('SELECT * FROM rides WHERE id = $1', [req.params.id]);
    
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    const ride = existing.rows[0];

    // Update status to cancelled (soft delete)
    await query(
      "UPDATE rides SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [req.params.id]
    );

    // Remove from calendar
    if (ride.calendar_event_id && ride.driver_id) {
      try {
        await deleteCalendarEvent(ride);
      } catch (calError) {
        console.error('Calendar delete failed:', calError);
      }
    }

    // Notify guest
    const guestResult = await query('SELECT * FROM guests WHERE id = $1', [ride.guest_id]);
    if (guestResult.rows.length > 0) {
      await sendSMS(
        guestResult.rows[0].phone,
        'Your ride has been cancelled. Reply to reschedule or contact the concierge.'
      );
    }

    res.json({ message: 'Ride cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling ride:', error);
    res.status(500).json({ error: 'Failed to cancel ride' });
  }
});

// Get upcoming rides for a guest (by phone)
router.get('/guest/phone/:phone', async (req, res) => {
  try {
    const normalizedPhone = normalizePhone(req.params.phone);
    
    const result = await query(
      `SELECT r.*, d.name as driver_name, d.phone as driver_phone
       FROM rides r
       LEFT JOIN drivers d ON r.driver_id = d.id
       LEFT JOIN guests g ON r.guest_id = g.id
       WHERE g.phone = $1 
         AND r.status NOT IN ('completed', 'cancelled')
         AND r.pickup_time > NOW()
       ORDER BY r.pickup_time ASC`,
      [normalizedPhone]
    );

    res.json({ rides: result.rows });
  } catch (error) {
    console.error('Error fetching guest rides:', error);
    res.status(500).json({ error: 'Failed to fetch rides' });
  }
});

function normalizePhone(phone) {
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 10) digits = '1' + digits;
  return '+' + digits;
}

export default router;
