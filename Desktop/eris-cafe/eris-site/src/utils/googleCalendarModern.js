// Modern Google Calendar API using Google Identity Services
// This replaces the deprecated gapi-script approach

const GOOGLE_CONFIG = {
  apiKey: import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY,
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  calendarId: import.meta.env.VITE_GOOGLE_CALENDAR_ID || 'primary',
  scopes: 'https://www.googleapis.com/auth/calendar.events'
};

console.log('🔧 Google Calendar Config Check:');
console.log('API Key:', GOOGLE_CONFIG.apiKey ? '✅ Present' : '❌ Missing');
console.log('Client ID:', GOOGLE_CONFIG.clientId ? '✅ Present' : '❌ Missing');
console.log('Calendar ID:', GOOGLE_CONFIG.calendarId);

let tokenClient;
let accessToken = null;
let gapiInited = false;

// Token storage keys
const TOKEN_KEY = 'google_calendar_token';
const TOKEN_EXPIRY_KEY = 'google_calendar_token_expiry';

// Load token from localStorage on init
const loadStoredToken = () => {
  const storedToken = localStorage.getItem(TOKEN_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  
  if (storedToken && expiry) {
    const expiryTime = parseInt(expiry);
    if (Date.now() < expiryTime) {
      accessToken = storedToken;
      console.log('✅ Loaded stored access token');
      return true;
    } else {
      console.log('⚠️ Stored token expired');
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
    }
  }
  return false;
};

// Store token in localStorage
const storeToken = (token, expiresIn = 3600) => {
  const expiryTime = Date.now() + (expiresIn * 1000);
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  console.log('💾 Token stored, expires in', expiresIn, 'seconds');
};

// Initialize GAPI (for Calendar API calls)
export const initGoogleCalendar = () => {
  return new Promise((resolve, reject) => {
    console.log('🔄 Initializing Google Calendar API...');
    
    if (!GOOGLE_CONFIG.apiKey) {
      reject(new Error('Google Calendar API Key is missing'));
      return;
    }
    
    if (!GOOGLE_CONFIG.clientId) {
      reject(new Error('Google Client ID is missing'));
      return;
    }

    // Load gapi script
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: GOOGLE_CONFIG.apiKey,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
          });
          gapiInited = true;
          
          // Try to load stored token
          if (loadStoredToken()) {
            window.gapi.client.setToken({ access_token: accessToken });
          }
          
          console.log('✅ Google Calendar API initialized');
          resolve(true);
        } catch (error) {
          console.error('❌ Failed to init gapi:', error);
          reject(error);
        }
      });
    };
    script.onerror = () => reject(new Error('Failed to load gapi script'));
    document.head.appendChild(script);
  });
};

// Initialize Google Identity Services (for OAuth)
export const initGoogleIdentity = () => {
  return new Promise((resolve, reject) => {
    console.log('🔄 Initializing Google Identity Services...');
    
    // Load GIS script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => {
      try {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CONFIG.clientId,
          scope: GOOGLE_CONFIG.scopes,
          callback: (response) => {
            if (response.error) {
              console.error('❌ OAuth error:', response);
              return;
            }
            accessToken = response.access_token;
            window.gapi.client.setToken({ access_token: accessToken });
            console.log('✅ Access token received');
          }
        });
        console.log('✅ Google Identity Services initialized');
        resolve(true);
      } catch (error) {
        console.error('❌ Failed to init GIS:', error);
        reject(error);
      }
    };
    script.onerror = () => reject(new Error('Failed to load GIS script'));
    document.head.appendChild(script);
  });
};

// Check if user is signed in
export const isSignedIn = () => {
  return !!accessToken;
};

// Sign in using modern token client (NO POPUP BLOCKERS!)
export const signIn = async () => {
  try {
    console.log('🔐 Requesting access token...');
    
    if (!gapiInited) {
      throw new Error('GAPI not initialized');
    }
    
    if (!tokenClient) {
      throw new Error('Token client not initialized');
    }

    // Request token - this opens a popup that's properly handled
    return new Promise((resolve) => {
      tokenClient.callback = async (response) => {
        if (response.error) {
          console.error('❌ Sign-in error:', response.error);
          resolve(false);
          return;
        }
        
        accessToken = response.access_token;
        
        // Store token with expiry (default 3600 seconds = 1 hour)
        const expiresIn = response.expires_in || 3600;
        storeToken(accessToken, expiresIn);
        
        window.gapi.client.setToken({ access_token: accessToken });
        console.log('✅ Successfully signed in!');
        resolve(true);
      };

      // Check if already has valid token
      if (accessToken) {
        console.log('✅ Already have access token');
        resolve(true);
        return;
      }

      // Request new token
      tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  } catch (error) {
    console.error('❌ Sign-in failed:', error);
    return false;
  }
};

// Sign out
export const signOut = async () => {
  try {
    if (accessToken) {
      window.google.accounts.oauth2.revoke(accessToken, () => {
        console.log('✅ Token revoked');
      });
      accessToken = null;
      window.gapi.client.setToken(null);
      
      // Clear stored token
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
      console.log('🗑️ Stored token cleared');
    }
    return true;
  } catch (error) {
    console.error('❌ Sign-out error:', error);
    return false;
  }
};

// Create calendar event
export const createCalendarEvent = async (event) => {
  try {
    if (!accessToken) {
      throw new Error('Not signed in');
    }

    const response = await window.gapi.client.calendar.events.insert({
      calendarId: GOOGLE_CONFIG.calendarId,
      resource: event
    });

    console.log('✅ Event created:', response.result);
    return {
      success: true,
      eventId: response.result.id,
      htmlLink: response.result.htmlLink
    };
  } catch (error) {
    console.error('❌ Failed to create event:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Update calendar event
export const updateCalendarEvent = async (eventId, event) => {
  try {
    if (!accessToken) {
      throw new Error('Not signed in');
    }

    const response = await window.gapi.client.calendar.events.update({
      calendarId: GOOGLE_CONFIG.calendarId,
      eventId: eventId,
      resource: event
    });

    console.log('✅ Event updated:', response.result);
    return {
      success: true,
      eventId: response.result.id,
      htmlLink: response.result.htmlLink
    };
  } catch (error) {
    console.error('❌ Failed to update event:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Delete calendar event
export const deleteCalendarEvent = async (eventId) => {
  try {
    if (!accessToken) {
      throw new Error('Not signed in');
    }

    await window.gapi.client.calendar.events.delete({
      calendarId: GOOGLE_CONFIG.calendarId,
      eventId: eventId
    });

    console.log('✅ Event deleted');
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to delete event:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Sync reservation to Google Calendar
export const syncReservationToCalendar = async (reservation) => {
  try {
    console.log('📅 Starting calendar sync for reservation:', reservation.reservationId);
    
    if (!accessToken) {
      throw new Error('Not signed in to Google Calendar');
    }
    
    const reservationDate = new Date(reservation.date);
    const [hours, minutes] = reservation.time.split(':');
    reservationDate.setHours(parseInt(hours), parseInt(minutes), 0);

    const endDate = new Date(reservationDate);
    endDate.setHours(reservationDate.getHours() + 2);

    console.log('📆 Event time:', reservationDate.toLocaleString(), '-', endDate.toLocaleString());

    const event = {
      summary: `Reservation: ${reservation.customerInfo?.name || 'Guest'}`,
      description: `
Table Reservation - Eris Cafe
Guests: ${reservation.guests}
Customer: ${reservation.customerInfo?.name}
Email: ${reservation.customerInfo?.email}
Phone: ${reservation.customerInfo?.phone}
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
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 60 }
        ]
      },
      colorId: '9' // Blue color for reservations
    };

    // If event already exists, update it
    if (reservation.googleCalendarEventId) {
      console.log('🔄 Updating existing event:', reservation.googleCalendarEventId);
      return await updateCalendarEvent(reservation.googleCalendarEventId, event);
    }

    // Otherwise create new event
    console.log('➕ Creating new calendar event');
    return await createCalendarEvent(event);
  } catch (error) {
    console.error('❌ Failed to sync reservation:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  initGoogleCalendar,
  initGoogleIdentity,
  isSignedIn,
  signIn,
  signOut,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  syncReservationToCalendar
};
