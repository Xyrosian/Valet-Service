import Anthropic from '@anthropic-ai/sdk';
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Send SMS
export async function sendSMS(to, body) {
  try {
    const message = await twilioClient.messages.create({
      body,
      to,
      from: process.env.TWILIO_PHONE_NUMBER
    });
    console.log(`SMS sent to ${to}: ${message.sid}`);
    return message;
  } catch (error) {
    console.error('SMS send error:', error);
    throw error;
  }
}

// Parse incoming message with AI
export async function parseMessage(messageBody, guestContext, rideContext) {
  const systemPrompt = `You are an AI assistant for a luxury hotel valet service. 
Your job is to understand guest SMS messages and determine their intent.

You must respond with valid JSON containing:
- intent: one of "schedule_change", "cancel", "eta_question", "location_question", "driver_contact", "general_question", "confirmation", "thanks", "unclear"
- confidence: number between 0 and 1
- extracted_data: object with any relevant extracted info like:
  - new_time: ISO datetime if they're rescheduling
  - time_adjustment: string like "+30 minutes" or "-1 hour" for relative changes
  - question: the specific question if asking something
- suggested_response: your suggested text response to the guest (keep it concise, warm, professional)
- needs_human: boolean - true if this should be escalated to the driver

Be concise and luxurious in tone. Never use emojis. Be warm but professional.`;

  const userPrompt = `Guest info:
- Name: ${guestContext.name}
- Current hotel: ${guestContext.hotel_name || 'Luxury Hotel'}
- Room: ${guestContext.room_number || 'N/A'}

${rideContext ? `Upcoming ride:
- Pickup time: ${new Date(rideContext.pickup_time).toLocaleString()}
- Pickup location: ${rideContext.pickup_location}
- Destination: ${rideContext.dropoff_location}
- Status: ${rideContext.status}` : 'No upcoming rides scheduled.'}

Guest message: "${messageBody}"

Parse this message and respond with JSON only.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      system: systemPrompt
    });

    const text = response.content[0].text;
    
    // Extract JSON from response (handle potential markdown wrapping)
    let jsonStr = text;
    if (text.includes('```json')) {
      jsonStr = text.split('```json')[1].split('```')[0];
    } else if (text.includes('```')) {
      jsonStr = text.split('```')[1].split('```')[0];
    }

    return JSON.parse(jsonStr.trim());
  } catch (error) {
    console.error('AI parsing error:', error);
    // Return a safe default that will escalate to human
    return {
      intent: 'unclear',
      confidence: 0,
      extracted_data: {},
      suggested_response: "I'll connect you with your driver right away.",
      needs_human: true
    };
  }
}

// Generate contextual response
export async function generateResponse(intent, guestContext, rideContext, extractedData) {
  const responses = {
    eta_question: () => {
      if (!rideContext) {
        return "You don't have any upcoming rides scheduled. Would you like me to arrange one for you?";
      }
      const pickupTime = new Date(rideContext.pickup_time);
      const now = new Date();
      const minutesUntil = Math.round((pickupTime - now) / 60000);
      
      if (minutesUntil < 0) {
        return "Your driver should be arriving momentarily. Please proceed to the pickup location.";
      } else if (minutesUntil < 15) {
        return `Your driver will arrive in approximately ${minutesUntil} minutes at ${rideContext.pickup_location}.`;
      } else {
        return `Your pickup is scheduled for ${pickupTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}. Your driver will arrive at ${rideContext.pickup_location}.`;
      }
    },

    confirmation: () => {
      if (!rideContext) {
        return "You're all set. Let me know if you need anything.";
      }
      const pickupTime = new Date(rideContext.pickup_time);
      return `Confirmed. Your driver will meet you at ${rideContext.pickup_location} at ${pickupTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}.`;
    },

    thanks: () => {
      return "My pleasure. Have a wonderful ride.";
    },

    location_question: () => {
      if (!rideContext) {
        return "I don't see an upcoming ride on your schedule. Would you like to arrange transportation?";
      }
      return `Your pickup location is ${rideContext.pickup_location}. Your destination is ${rideContext.dropoff_location}.`;
    },

    cancel: () => {
      return "I've cancelled your upcoming ride. Just text back anytime you'd like to schedule another.";
    },

    schedule_change: () => {
      // This will be handled by the route with actual database updates
      return "I've updated your pickup time. You'll receive a confirmation shortly.";
    },

    general_question: () => {
      return extractedData?.suggested_response || "Let me connect you with your driver who can better assist.";
    },

    unclear: () => {
      return "I'll connect you with your driver who can assist you directly.";
    },

    driver_contact: () => {
      return "I'm connecting you with your driver now.";
    }
  };

  return responses[intent]?.() || responses.unclear();
}

// Format driver notification
export function formatDriverNotification(guest, ride, message, parsedIntent) {
  return `📱 Message from ${guest.name} (Room ${guest.room_number || 'N/A'}):\n\n` +
    `"${message}"\n\n` +
    `Intent: ${parsedIntent.intent}\n` +
    `Ride: ${new Date(ride.pickup_time).toLocaleString()}\n` +
    `${ride.pickup_location} → ${ride.dropoff_location}`;
}

export default {
  sendSMS,
  parseMessage,
  generateResponse,
  formatDriverNotification
};
