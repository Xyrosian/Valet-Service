import express from 'express';
import { query } from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Register new guest (from web form)
router.post('/', async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      hotel_id,
      room_number,
      check_in_date,
      check_out_date,
      preferences
    } = req.body;

    // Validate required fields
    if (!name || !phone || !hotel_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, phone, hotel_id' 
      });
    }

    // Normalize phone number (strip non-digits, ensure +1 prefix)
    const normalizedPhone = normalizePhone(phone);

    // Check if guest already exists for this hotel
    const existingGuest = await query(
      'SELECT * FROM guests WHERE phone = $1 AND hotel_id = $2',
      [normalizedPhone, hotel_id]
    );

    if (existingGuest.rows.length > 0) {
      // Update existing guest
      const result = await query(
        `UPDATE guests SET 
          name = $1, 
          email = $2, 
          room_number = $3,
          check_in_date = $4,
          check_out_date = $5,
          preferences = $6,
          updated_at = CURRENT_TIMESTAMP
        WHERE phone = $7 AND hotel_id = $8
        RETURNING *`,
        [name, email, room_number, check_in_date, check_out_date, 
         JSON.stringify(preferences || {}), normalizedPhone, hotel_id]
      );
      return res.json({ guest: result.rows[0], updated: true });
    }

    // Create new guest
    const result = await query(
      `INSERT INTO guests (name, phone, email, hotel_id, room_number, 
        check_in_date, check_out_date, preferences)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [name, normalizedPhone, email, hotel_id, room_number,
       check_in_date, check_out_date, JSON.stringify(preferences || {})]
    );

    res.status(201).json({ guest: result.rows[0], created: true });
  } catch (error) {
    console.error('Error creating guest:', error);
    res.status(500).json({ error: 'Failed to create guest' });
  }
});

// Get guest by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM guests WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Guest not found' });
    }

    res.json({ guest: result.rows[0] });
  } catch (error) {
    console.error('Error fetching guest:', error);
    res.status(500).json({ error: 'Failed to fetch guest' });
  }
});

// Get guest by phone (for SMS routing)
router.get('/phone/:phone', async (req, res) => {
  try {
    const normalizedPhone = normalizePhone(req.params.phone);
    const result = await query(
      'SELECT * FROM guests WHERE phone = $1 ORDER BY created_at DESC LIMIT 1',
      [normalizedPhone]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Guest not found' });
    }

    res.json({ guest: result.rows[0] });
  } catch (error) {
    console.error('Error fetching guest by phone:', error);
    res.status(500).json({ error: 'Failed to fetch guest' });
  }
});

// Update guest preferences
router.patch('/:id/preferences', async (req, res) => {
  try {
    const { preferences } = req.body;
    
    const result = await query(
      `UPDATE guests SET 
        preferences = preferences || $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *`,
      [JSON.stringify(preferences), req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Guest not found' });
    }

    res.json({ guest: result.rows[0] });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Helper function to normalize phone numbers
function normalizePhone(phone) {
  // Strip all non-digits
  let digits = phone.replace(/\D/g, '');
  
  // Add US country code if not present
  if (digits.length === 10) {
    digits = '1' + digits;
  }
  
  // Ensure + prefix
  return '+' + digits;
}

export default router;
