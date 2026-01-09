import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// Get hotel details
router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM hotels WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Hotel not found' });
    }

    res.json({ hotel: result.rows[0] });
  } catch (error) {
    console.error('Error fetching hotel:', error);
    res.status(500).json({ error: 'Failed to fetch hotel' });
  }
});

// Get all rides for a hotel (dashboard view)
router.get('/:id/rides', async (req, res) => {
  try {
    const { date, status, driver_id } = req.query;

    let sql = `
      SELECT r.*, 
        g.name as guest_name, g.phone as guest_phone, g.room_number, g.preferences as guest_preferences,
        d.name as driver_name, d.phone as driver_phone, d.vehicle_info
      FROM rides r
      LEFT JOIN guests g ON r.guest_id = g.id
      LEFT JOIN drivers d ON r.driver_id = d.id
      WHERE r.hotel_id = $1
    `;
    const params = [req.params.id];
    let paramIndex = 2;

    if (date) {
      sql += ` AND DATE(r.pickup_time) = $${paramIndex++}`;
      params.push(date);
    }
    if (status) {
      sql += ` AND r.status = $${paramIndex++}`;
      params.push(status);
    }
    if (driver_id) {
      sql += ` AND r.driver_id = $${paramIndex++}`;
      params.push(driver_id);
    }

    sql += ' ORDER BY r.pickup_time ASC';

    const result = await query(sql, params);
    res.json({ rides: result.rows });
  } catch (error) {
    console.error('Error fetching hotel rides:', error);
    res.status(500).json({ error: 'Failed to fetch rides' });
  }
});

// Get hotel's drivers
router.get('/:id/drivers', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, phone, vehicle_info, is_active, 
        google_calendar_id IS NOT NULL as calendar_connected
       FROM drivers 
       WHERE hotel_id = $1 
       ORDER BY name`,
      [req.params.id]
    );
    res.json({ drivers: result.rows });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
});

// Get hotel's guests (active)
router.get('/:id/guests', async (req, res) => {
  try {
    const result = await query(
      `SELECT g.*, 
        (SELECT COUNT(*) FROM rides r WHERE r.guest_id = g.id AND r.status NOT IN ('completed', 'cancelled')) as upcoming_rides
       FROM guests g
       WHERE g.hotel_id = $1 
         AND (g.check_out_date IS NULL OR g.check_out_date >= CURRENT_DATE)
       ORDER BY g.created_at DESC`,
      [req.params.id]
    );
    res.json({ guests: result.rows });
  } catch (error) {
    console.error('Error fetching guests:', error);
    res.status(500).json({ error: 'Failed to fetch guests' });
  }
});

// Hotel staff books ride for guest
router.post('/:id/rides', async (req, res) => {
  try {
    const hotel_id = req.params.id;
    const {
      guest_id,
      guest_name,
      guest_phone,
      guest_room,
      driver_id,
      pickup_time,
      pickup_location,
      pickup_notes,
      dropoff_location,
      dropoff_notes,
      passenger_count,
      special_requests
    } = req.body;

    let finalGuestId = guest_id;

    // If no guest_id, create or find guest
    if (!finalGuestId && guest_phone) {
      const normalizedPhone = normalizePhone(guest_phone);
      
      // Check for existing guest
      const existingGuest = await query(
        'SELECT id FROM guests WHERE phone = $1 AND hotel_id = $2',
        [normalizedPhone, hotel_id]
      );

      if (existingGuest.rows.length > 0) {
        finalGuestId = existingGuest.rows[0].id;
        // Update room number if provided
        if (guest_room) {
          await query(
            'UPDATE guests SET room_number = $1 WHERE id = $2',
            [guest_room, finalGuestId]
          );
        }
      } else {
        // Create new guest
        const newGuest = await query(
          `INSERT INTO guests (name, phone, hotel_id, room_number)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [guest_name || 'Guest', normalizedPhone, hotel_id, guest_room]
        );
        finalGuestId = newGuest.rows[0].id;
      }
    }

    if (!finalGuestId) {
      return res.status(400).json({ error: 'Guest ID or phone required' });
    }

    // Assign driver if not specified
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

    // Create ride
    const result = await query(
      `INSERT INTO rides (
        guest_id, driver_id, hotel_id, pickup_time, pickup_location,
        pickup_notes, dropoff_location, dropoff_notes, passenger_count,
        special_requests, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'hotel_staff')
      RETURNING *`,
      [finalGuestId, assignedDriverId, hotel_id, pickup_time, pickup_location,
       pickup_notes, dropoff_location, dropoff_notes, passenger_count || 1,
       special_requests]
    );

    const ride = result.rows[0];

    // Get full ride details for response
    const fullRide = await query(
      `SELECT r.*, 
        g.name as guest_name, g.phone as guest_phone, g.room_number,
        d.name as driver_name
       FROM rides r
       LEFT JOIN guests g ON r.guest_id = g.id
       LEFT JOIN drivers d ON r.driver_id = d.id
       WHERE r.id = $1`,
      [ride.id]
    );

    res.status(201).json({ ride: fullRide.rows[0] });
  } catch (error) {
    console.error('Error creating ride:', error);
    res.status(500).json({ error: 'Failed to create ride' });
  }
});

// Dashboard statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const hotelId = req.params.id;
    const today = new Date().toISOString().split('T')[0];

    const [todayRides, pendingRides, completedToday, activeGuests, activeDrivers] = await Promise.all([
      query(
        `SELECT COUNT(*) FROM rides WHERE hotel_id = $1 AND DATE(pickup_time) = $2`,
        [hotelId, today]
      ),
      query(
        `SELECT COUNT(*) FROM rides WHERE hotel_id = $1 AND status = 'scheduled' AND pickup_time > NOW()`,
        [hotelId]
      ),
      query(
        `SELECT COUNT(*) FROM rides WHERE hotel_id = $1 AND status = 'completed' AND DATE(completed_at) = $2`,
        [hotelId, today]
      ),
      query(
        `SELECT COUNT(*) FROM guests WHERE hotel_id = $1 AND (check_out_date IS NULL OR check_out_date >= CURRENT_DATE)`,
        [hotelId]
      ),
      query(
        `SELECT COUNT(*) FROM drivers WHERE hotel_id = $1 AND is_active = true`,
        [hotelId]
      )
    ]);

    res.json({
      stats: {
        today_rides: parseInt(todayRides.rows[0].count),
        pending_rides: parseInt(pendingRides.rows[0].count),
        completed_today: parseInt(completedToday.rows[0].count),
        active_guests: parseInt(activeGuests.rows[0].count),
        active_drivers: parseInt(activeDrivers.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Create driver
router.post('/:id/drivers', async (req, res) => {
  try {
    const { name, phone, email, vehicle_info } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone required' });
    }

    const result = await query(
      `INSERT INTO drivers (name, phone, email, hotel_id, vehicle_info)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, normalizePhone(phone), email, req.params.id, JSON.stringify(vehicle_info || {})]
    );

    res.status(201).json({ driver: result.rows[0] });
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({ error: 'Failed to create driver' });
  }
});

function normalizePhone(phone) {
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 10) digits = '1' + digits;
  return '+' + digits;
}

export default router;
