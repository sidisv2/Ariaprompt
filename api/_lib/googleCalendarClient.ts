export interface GoogleCalendarEventOptions {
  summary: string;
  description: string;
  location?: string;
  startIso: string;
  endIso?: string;
  attendeeEmail?: string;
  attendeePhone?: string;
  accessToken?: string;
  calendarId?: string;
}

/**
 * Creates an event in Google Calendar using OAuth2 access token or calendar webhook
 */
export async function createGoogleCalendarEvent(options: GoogleCalendarEventOptions): Promise<{
  success: boolean;
  eventId?: string;
  htmlLink?: string;
  error?: string;
}> {
  const {
    summary,
    description,
    location,
    startIso,
    endIso,
    attendeeEmail,
    accessToken = process.env.GOOGLE_CALENDAR_ACCESS_TOKEN || process.env.GOOGLE_CALENDAR_TOKEN,
    calendarId = 'primary',
  } = options;

  if (!accessToken) {
    console.log('ℹ️ Google Calendar Access Token not configured for direct API insert. Event saved to database.');
    return { success: false, error: 'No Google Calendar token configured' };
  }

  // Calculate default 1 hour end time if not specified
  const startTime = new Date(startIso);
  const endTime = endIso ? new Date(endIso) : new Date(startTime.getTime() + 60 * 60 * 1000);

  const eventPayload = {
    summary,
    description,
    location: location || 'Oficina Inmobiliaria / Enlace de reunión',
    start: {
      dateTime: startTime.toISOString(),
      timeZone: 'America/Argentina/Buenos_Aires',
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: 'America/Argentina/Buenos_Aires',
    },
    attendees: attendeeEmail ? [{ email: attendeeEmail }] : [],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 30 },
      ],
    },
  };

  try {
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.warn('⚠️ Google Calendar API event creation notice:', data?.error?.message || res.statusText);
      return { success: false, error: data?.error?.message || `HTTP ${res.status}` };
    }

    console.log(`✅ Google Calendar event successfully created: ${data.id} (${data.htmlLink || 'N/A'})`);
    return {
      success: true,
      eventId: data.id,
      htmlLink: data.htmlLink,
    };
  } catch (err: any) {
    console.warn('⚠️ Google Calendar API network exception:', err.message || err);
    return { success: false, error: err.message || String(err) };
  }
}
