import express from 'express';
import { query } from '../db.js';
import { getAuthUrl, handleCallback, getDriverSchedule, syncRideToCalendar } from '../services/calendar.js';

const router = express.Router();

// Get OAuth URL for driver to connect calendar
router.get('/connect/:driverId', async (req, res) => {
  try {
    const url = getAuthUrl(req.params.driverId);
    res.json({ authUrl: url });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

// OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code, state: driverId } = req.query;

    if (!code || !driverId) {
      return res.status(400).send('Missing code or driver ID');
    }

    await handleCallback(code, driverId);

    // Redirect to success page (or driver dashboard)
    res.send(`
      <html>
        <body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
          <div style="text-align: center;">
            <h1 style="color: #22c55e;">✓ Calendar Connected</h1>
            <p>Your Google Calendar is now synced with the valet system.</p>
            <p>You can close this window.</p>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).send('Failed to connect calendar. Please try again.');
  }
});

// Get driver's schedule
router.get('/schedule/:driverId', async (req, res) => {
  try {
    const { start, end } = req.query;
    
    const startDate = start ? new Date(start) : new Date();
    const endDate = end ? new Date(end) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const events = await getDriverSchedule(req.params.driverId, startDate, endDate);
    res.json({ events });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

// Manually sync all upcoming rides for a driver
router.post('/sync/:driverId', async (req, res) => {
  try {
    const rides = await query(
      `SELECT * FROM rides 
       WHERE driver_id = $1 
         AND status NOT IN ('completed', 'cancelled')
         AND pickup_time > NOW()
       ORDER BY pickup_time ASC`,
      [req.params.driverId]
    );

    const synced = [];
    const failed = [];

    for (const ride of rides.rows) {
      try {
        await syncRideToCalendar(ride);
        synced.push(ride.id);
      } catch (error) {
        failed.push({ id: ride.id, error: error.message });
      }
    }

    res.json({ 
      message: `Synced ${synced.length} rides`,
      synced,
      failed
    });
  } catch (error) {
    console.error('Bulk sync error:', error);
    res.status(500).json({ error: 'Failed to sync rides' });
  }
});

// Check if driver has calendar connected
router.get('/status/:driverId', async (req, res) => {
  try {
    const result = await query(
      'SELECT google_refresh_token, google_calendar_id FROM drivers WHERE id = $1',
      [req.params.driverId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const driver = result.rows[0];
    res.json({
      connected: !!driver.google_refresh_token,
      calendarId: driver.google_calendar_id
    });
  } catch (error) {
    console.error('Error checking calendar status:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

// Disconnect calendar
router.delete('/disconnect/:driverId', async (req, res) => {
  try {
    await query(
      'UPDATE drivers SET google_refresh_token = NULL, google_calendar_id = NULL WHERE id = $1',
      [req.params.driverId]
    );
    res.json({ message: 'Calendar disconnected' });
  } catch (error) {
    console.error('Error disconnecting calendar:', error);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

export default router;
