import { gapi } from 'gapi-script';

// Google Calendar API configuration
const GOOGLE_CONFIG = {
  apiKey: import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY,
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  calendarId: import.meta.env.VITE_GOOGLE_CALENDAR_ID || 'primary',
  discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
  scope: 'https://www.googleapis.com/auth/calendar.events'
};

// Debug configuration
console.log('🔧 Google Calendar Config Check:');
console.log('API Key:', GOOGLE_CONFIG.apiKey ? '✅ Present' : '❌ Missing');
console.log('Client ID:', GOOGLE_CONFIG.clientId ? '✅ Present' : '❌ Missing');
console.log('Calendar ID:', GOOGLE_CONFIG.calendarId);

// Initialize the Google API client
export const initGoogleCalendar = () => {
  return new Promise((resolve, reject) => {
    console.log('🔄 Initializing Google Calendar API...');
    
    // Check if credentials exist
    if (!GOOGLE_CONFIG.apiKey) {
      const error = new Error('Google Calendar API Key is missing. Please add VITE_GOOGLE_CALENDAR_API_KEY to your .env file.');
      console.error('❌', error.message);
      reject(error);
      return;
    }
    
    if (!GOOGLE_CONFIG.clientId) {
      const error = new Error('Google Client ID is missing. Please add VITE_GOOGLE_CLIENT_ID to your .env file.');
      console.error('❌', error.message);
      reject(error);
      return;
    }

    // Load gapi
    gapi.load('client:auth2', async () => {
      try {
        console.log('📦 GAPI loaded, initializing client...');
        
        await gapi.client.init({
          apiKey: GOOGLE_CONFIG.apiKey,
          clientId: GOOGLE_CONFIG.clientId,
          discoveryDocs: GOOGLE_CONFIG.discoveryDocs,
          scope: GOOGLE_CONFIG.scope
        });
        
        console.log('✅ Google Calendar API initialized successfully');
        resolve(gapi);
      } catch (error) {
        console.error('❌ Error initializing Google Calendar API:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          result: error.result
        });
        reject(error);
      }
    });
  });
};

// Check if user is signed in to Google
export const isSignedIn = () => {
  try {
    const authInstance = gapi.auth2.getAuthInstance();
    if (!authInstance) {
      console.warn('⚠️ Auth instance not initialized');
      return false;
    }
    return authInstance.isSignedIn.get();
  } catch (error) {
    console.error('❌ Error checking sign-in status:', error);
    return false;
  }
};

// Sign in to Google
export const signIn = async () => {
  try {
    console.log('🔐 Attempting to sign in to Google...');
    
    const authInstance = gapi.auth2.getAuthInstance();
    if (!authInstance) {
      throw new Error('Google Auth not initialized. Please refresh the page and try again.');
    }
    
    // Check if already signed in
    if (authInstance.isSignedIn.get()) {
      console.log('✅ Already signed in');
      return true;
    }
    
    // Sign in
    await authInstance.signIn({
      prompt: 'select_account'
    });
    
    console.log('✅ Signed in successfully');
    return true;
  } catch (error) {
    console.error('❌ Error signing in to Google:', error);
    
    // Provide specific error messages
    if (error.error === 'popup_closed_by_user') {
      console.error('User closed the sign-in popup');
    } else if (error.error === 'access_denied') {
      console.error('User denied access');
    } else if (error.error === 'idpiframe_initialization_failed') {
      console.error('OAuth configuration issue. Check your Client ID and authorized origins.');
    }
    
    return false;
  }
};

// Sign out from Google
export const signOut = async () => {
  try {
    await gapi.auth2.getAuthInstance().signOut();
    return true;
  } catch (error) {
    console.error('Error signing out from Google:', error);
    return false;
  }
};

// Convert reservation to Google Calendar event format
const reservationToCalendarEvent = (reservation) => {
  const reservationDate = new Date(reservation.date);
  const [hours, minutes] = reservation.time.split(':');
  reservationDate.setHours(parseInt(hours), parseInt(minutes), 0);

  // Create end time (assume 2 hour duration)
  const endDate = new Date(reservationDate);
  endDate.setHours(reservationDate.getHours() + 2);

  return {
    summary: `Reservation: ${reservation.customerInfo?.name} - ${reservation.guests} guests`,
    description: `
Reservation Details:
- Reservation ID: ${reservation.reservationId}
- Customer: ${reservation.customerInfo?.name}
- Email: ${reservation.customerInfo?.email}
- Phone: ${reservation.customerInfo?.phone}
- Number of Guests: ${reservation.guests}
- Status: ${reservation.status}
${reservation.specialRequests ? `\nSpecial Requests: ${reservation.specialRequests}` : ''}
    `.trim(),
    start: {
      dateTime: reservationDate.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    colorId: getColorIdByStatus(reservation.status),
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 day before
        { method: 'popup', minutes: 60 } // 1 hour before
      ]
    }
  };
};

// Get Google Calendar color ID based on reservation status
const getColorIdByStatus = (status) => {
  switch (status?.toLowerCase()) {
    case 'confirmed': return '10'; // Green
    case 'pending': return '5'; // Yellow
    case 'cancelled': return '11'; // Red
    default: return '8'; // Gray
  }
};

// Create a new event in Google Calendar
export const createCalendarEvent = async (reservation) => {
  try {
    if (!isSignedIn()) {
      throw new Error('Not signed in to Google Calendar');
    }

    const event = reservationToCalendarEvent(reservation);
    
    const response = await gapi.client.calendar.events.insert({
      calendarId: GOOGLE_CONFIG.calendarId,
      resource: event
    });

    console.log('Event created:', response.result);
    return {
      success: true,
      eventId: response.result.id,
      htmlLink: response.result.htmlLink
    };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Update an existing event in Google Calendar
export const updateCalendarEvent = async (eventId, reservation) => {
  try {
    if (!isSignedIn()) {
      throw new Error('Not signed in to Google Calendar');
    }

    const event = reservationToCalendarEvent(reservation);
    
    const response = await gapi.client.calendar.events.update({
      calendarId: GOOGLE_CONFIG.calendarId,
      eventId: eventId,
      resource: event
    });

    console.log('Event updated:', response.result);
    return {
      success: true,
      eventId: response.result.id,
      htmlLink: response.result.htmlLink
    };
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Delete an event from Google Calendar
export const deleteCalendarEvent = async (eventId) => {
  try {
    if (!isSignedIn()) {
      throw new Error('Not signed in to Google Calendar');
    }

    await gapi.client.calendar.events.delete({
      calendarId: GOOGLE_CONFIG.calendarId,
      eventId: eventId
    });

    console.log('Event deleted:', eventId);
    return {
      success: true
    };
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get all events from Google Calendar
export const getCalendarEvents = async (timeMin, timeMax) => {
  try {
    if (!isSignedIn()) {
      throw new Error('Not signed in to Google Calendar');
    }

    const response = await gapi.client.calendar.events.list({
      calendarId: GOOGLE_CONFIG.calendarId,
      timeMin: timeMin || new Date().toISOString(),
      timeMax: timeMax,
      showDeleted: false,
      singleEvents: true,
      orderBy: 'startTime'
    });

    return {
      success: true,
      events: response.result.items || []
    };
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return {
      success: false,
      error: error.message,
      events: []
    };
  }
};

// Sync a reservation with Google Calendar
export const syncReservationToCalendar = async (reservation) => {
  try {
    // Check if reservation already has a Google Calendar event ID
    if (reservation.googleCalendarEventId) {
      // Update existing event
      return await updateCalendarEvent(reservation.googleCalendarEventId, reservation);
    } else {
      // Create new event
      return await createCalendarEvent(reservation);
    }
  } catch (error) {
    console.error('Error syncing reservation:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
