import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// Get all driver metrics for a hotel
router.get('/hotel/:hotelId/drivers', async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { start_date, end_date } = req.query;

    // Default to last 30 days if no dates provided
    const endDate = end_date || new Date().toISOString().split('T')[0];
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const result = await query(`
      SELECT 
        d.id,
        d.name,
        d.phone,
        d.vehicle_info,
        
        -- Ride counts
        COUNT(r.id) FILTER (WHERE r.status != 'cancelled') as total_rides,
        COUNT(r.id) FILTER (WHERE r.status = 'completed') as completed_rides,
        COUNT(r.id) FILTER (WHERE r.status = 'cancelled') as cancelled_rides,
        
        -- Passenger count
        COALESCE(SUM(r.passenger_count) FILTER (WHERE r.status = 'completed'), 0) as total_passengers,
        
        -- Average ride duration (in minutes)
        COALESCE(
          AVG(
            EXTRACT(EPOCH FROM (r.completed_at - r.driver_departed_at)) / 60
          ) FILTER (WHERE r.status = 'completed' AND r.completed_at IS NOT NULL AND r.driver_departed_at IS NOT NULL),
          0
        ) as avg_ride_duration_minutes,
        
        -- Miles driven (estimated from ride duration - can be replaced with actual tracking)
        COALESCE(
          SUM(
            EXTRACT(EPOCH FROM (r.completed_at - r.driver_departed_at)) / 60 * 0.5
          ) FILTER (WHERE r.status = 'completed' AND r.completed_at IS NOT NULL AND r.driver_departed_at IS NOT NULL),
          0
        ) as estimated_miles,
        
        -- Cancellation rate
        CASE 
          WHEN COUNT(r.id) > 0 THEN
            ROUND(
              (COUNT(r.id) FILTER (WHERE r.status = 'cancelled')::numeric / COUNT(r.id)::numeric) * 100,
              1
            )
          ELSE 0
        END as cancellation_rate,
        
        -- Average passengers per ride
        CASE 
          WHEN COUNT(r.id) FILTER (WHERE r.status = 'completed') > 0 THEN
            ROUND(
              SUM(r.passenger_count) FILTER (WHERE r.status = 'completed')::numeric / 
              COUNT(r.id) FILTER (WHERE r.status = 'completed')::numeric,
              1
            )
          ELSE 0
        END as avg_passengers_per_ride
        
      FROM drivers d
      LEFT JOIN rides r ON d.id = r.driver_id 
        AND r.pickup_time >= $2::date 
        AND r.pickup_time < ($3::date + interval '1 day')
      WHERE d.hotel_id = $1 AND d.is_active = true
      GROUP BY d.id, d.name, d.phone, d.vehicle_info
      ORDER BY total_rides DESC
    `, [hotelId, startDate, endDate]);

    res.json({ 
      drivers: result.rows,
      date_range: { start: startDate, end: endDate }
    });
  } catch (error) {
    console.error('Error fetching driver metrics:', error);
    res.status(500).json({ error: 'Failed to fetch driver metrics' });
  }
});

// Get single driver detailed metrics
router.get('/driver/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;
    const { start_date, end_date } = req.query;

    const endDate = end_date || new Date().toISOString().split('T')[0];
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get driver info
    const driverResult = await query(
      'SELECT * FROM drivers WHERE id = $1',
      [driverId]
    );

    if (driverResult.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Get aggregate metrics
    const metricsResult = await query(`
      SELECT 
        COUNT(id) FILTER (WHERE status != 'cancelled') as total_rides,
        COUNT(id) FILTER (WHERE status = 'completed') as completed_rides,
        COUNT(id) FILTER (WHERE status = 'cancelled') as cancelled_rides,
        COUNT(id) FILTER (WHERE status = 'scheduled') as scheduled_rides,
        
        COALESCE(SUM(passenger_count) FILTER (WHERE status = 'completed'), 0) as total_passengers,
        
        COALESCE(
          AVG(EXTRACT(EPOCH FROM (completed_at - driver_departed_at)) / 60) 
          FILTER (WHERE status = 'completed' AND completed_at IS NOT NULL AND driver_departed_at IS NOT NULL),
          0
        ) as avg_ride_duration_minutes,
        
        COALESCE(
          MIN(EXTRACT(EPOCH FROM (completed_at - driver_departed_at)) / 60)
          FILTER (WHERE status = 'completed' AND completed_at IS NOT NULL AND driver_departed_at IS NOT NULL),
          0
        ) as min_ride_duration_minutes,
        
        COALESCE(
          MAX(EXTRACT(EPOCH FROM (completed_at - driver_departed_at)) / 60)
          FILTER (WHERE status = 'completed' AND completed_at IS NOT NULL AND driver_departed_at IS NOT NULL),
          0
        ) as max_ride_duration_minutes,
        
        COALESCE(
          SUM(EXTRACT(EPOCH FROM (completed_at - driver_departed_at)) / 60 * 0.5)
          FILTER (WHERE status = 'completed' AND completed_at IS NOT NULL AND driver_departed_at IS NOT NULL),
          0
        ) as estimated_miles
        
      FROM rides 
      WHERE driver_id = $1 
        AND pickup_time >= $2::date 
        AND pickup_time < ($3::date + interval '1 day')
    `, [driverId, startDate, endDate]);

    // Get daily breakdown
    const dailyResult = await query(`
      SELECT 
        DATE(pickup_time) as date,
        COUNT(id) FILTER (WHERE status = 'completed') as completed_rides,
        COUNT(id) FILTER (WHERE status = 'cancelled') as cancelled_rides,
        COALESCE(SUM(passenger_count) FILTER (WHERE status = 'completed'), 0) as passengers,
        COALESCE(
          SUM(EXTRACT(EPOCH FROM (completed_at - driver_departed_at)) / 60 * 0.5)
          FILTER (WHERE status = 'completed' AND completed_at IS NOT NULL AND driver_departed_at IS NOT NULL),
          0
        ) as miles
      FROM rides 
      WHERE driver_id = $1 
        AND pickup_time >= $2::date 
        AND pickup_time < ($3::date + interval '1 day')
      GROUP BY DATE(pickup_time)
      ORDER BY date ASC
    `, [driverId, startDate, endDate]);

    // Get hourly distribution
    const hourlyResult = await query(`
      SELECT 
        EXTRACT(HOUR FROM pickup_time)::int as hour,
        COUNT(id) as ride_count
      FROM rides 
      WHERE driver_id = $1 
        AND pickup_time >= $2::date 
        AND pickup_time < ($3::date + interval '1 day')
        AND status = 'completed'
      GROUP BY EXTRACT(HOUR FROM pickup_time)
      ORDER BY hour
    `, [driverId, startDate, endDate]);

    // Get top destinations
    const destinationsResult = await query(`
      SELECT 
        dropoff_location,
        COUNT(id) as visit_count
      FROM rides 
      WHERE driver_id = $1 
        AND pickup_time >= $2::date 
        AND pickup_time < ($3::date + interval '1 day')
        AND status = 'completed'
      GROUP BY dropoff_location
      ORDER BY visit_count DESC
      LIMIT 10
    `, [driverId, startDate, endDate]);

    res.json({
      driver: driverResult.rows[0],
      metrics: metricsResult.rows[0],
      daily_breakdown: dailyResult.rows,
      hourly_distribution: hourlyResult.rows,
      top_destinations: destinationsResult.rows,
      date_range: { start: startDate, end: endDate }
    });
  } catch (error) {
    console.error('Error fetching driver details:', error);
    res.status(500).json({ error: 'Failed to fetch driver details' });
  }
});

// Get hotel-wide analytics
router.get('/hotel/:hotelId/overview', async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { start_date, end_date } = req.query;

    const endDate = end_date || new Date().toISOString().split('T')[0];
    const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Overall metrics
    const overallResult = await query(`
      SELECT 
        COUNT(id) as total_rides,
        COUNT(id) FILTER (WHERE status = 'completed') as completed_rides,
        COUNT(id) FILTER (WHERE status = 'cancelled') as cancelled_rides,
        COALESCE(SUM(passenger_count) FILTER (WHERE status = 'completed'), 0) as total_passengers,
        
        COALESCE(
          AVG(EXTRACT(EPOCH FROM (completed_at - driver_departed_at)) / 60)
          FILTER (WHERE status = 'completed' AND completed_at IS NOT NULL AND driver_departed_at IS NOT NULL),
          0
        ) as avg_ride_duration_minutes,
        
        COALESCE(
          SUM(EXTRACT(EPOCH FROM (completed_at - driver_departed_at)) / 60 * 0.5)
          FILTER (WHERE status = 'completed' AND completed_at IS NOT NULL AND driver_departed_at IS NOT NULL),
          0
        ) as total_estimated_miles,
        
        COUNT(DISTINCT guest_id) as unique_guests,
        COUNT(DISTINCT driver_id) as active_drivers
        
      FROM rides 
      WHERE hotel_id = $1 
        AND pickup_time >= $2::date 
        AND pickup_time < ($3::date + interval '1 day')
    `, [hotelId, startDate, endDate]);

    // Daily trend
    const dailyTrend = await query(`
      SELECT 
        DATE(pickup_time) as date,
        COUNT(id) as total_rides,
        COUNT(id) FILTER (WHERE status = 'completed') as completed,
        COUNT(id) FILTER (WHERE status = 'cancelled') as cancelled,
        COALESCE(SUM(passenger_count) FILTER (WHERE status = 'completed'), 0) as passengers
      FROM rides 
      WHERE hotel_id = $1 
        AND pickup_time >= $2::date 
        AND pickup_time < ($3::date + interval '1 day')
      GROUP BY DATE(pickup_time)
      ORDER BY date ASC
    `, [hotelId, startDate, endDate]);

    // Peak hours
    const peakHours = await query(`
      SELECT 
        EXTRACT(HOUR FROM pickup_time)::int as hour,
        COUNT(id) as ride_count
      FROM rides 
      WHERE hotel_id = $1 
        AND pickup_time >= $2::date 
        AND pickup_time < ($3::date + interval '1 day')
      GROUP BY EXTRACT(HOUR FROM pickup_time)
      ORDER BY ride_count DESC
    `, [hotelId, startDate, endDate]);

    // Comparison with previous period
    const periodLength = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    const prevStartDate = new Date(new Date(startDate) - periodLength * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const prevEndDate = startDate;

    const prevPeriodResult = await query(`
      SELECT 
        COUNT(id) FILTER (WHERE status = 'completed') as completed_rides,
        COALESCE(SUM(passenger_count) FILTER (WHERE status = 'completed'), 0) as total_passengers,
        COALESCE(
          SUM(EXTRACT(EPOCH FROM (completed_at - driver_departed_at)) / 60 * 0.5)
          FILTER (WHERE status = 'completed' AND completed_at IS NOT NULL AND driver_departed_at IS NOT NULL),
          0
        ) as total_estimated_miles
      FROM rides 
      WHERE hotel_id = $1 
        AND pickup_time >= $2::date 
        AND pickup_time < $3::date
    `, [hotelId, prevStartDate, prevEndDate]);

    const current = overallResult.rows[0];
    const previous = prevPeriodResult.rows[0];

    const calculateChange = (curr, prev) => {
      if (!prev || prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    res.json({
      overview: current,
      daily_trend: dailyTrend.rows,
      peak_hours: peakHours.rows,
      comparison: {
        rides_change: calculateChange(
          parseInt(current.completed_rides), 
          parseInt(previous.completed_rides)
        ),
        passengers_change: calculateChange(
          parseInt(current.total_passengers), 
          parseInt(previous.total_passengers)
        ),
        miles_change: calculateChange(
          parseFloat(current.total_estimated_miles), 
          parseFloat(previous.total_estimated_miles)
        )
      },
      date_range: { start: startDate, end: endDate }
    });
  } catch (error) {
    console.error('Error fetching hotel analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
