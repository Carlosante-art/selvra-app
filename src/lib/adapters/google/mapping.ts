import type { CreateEventRequest } from '@/lib/protocol/types'

/**
 * Google → Selvra event-mapping.
 *
 * Två event-typer:
 * - `google.calendar.event_observed` — kalender-event (möten, åtaganden,
 *   händelser planerade av användaren). Visar "vad användaren säger att hen
 *   gör" på lager 2-nivån (planerad-tid-avsikt).
 * - `google.gmail.thread_observed` — mail-metadata (avsändare, label,
 *   timestamp). Visar "uppmärksamhet" — vad användaren ägnar tid åt. Aldrig
 *   innehåll — gmail.metadata-scope exponerar inte body.
 *
 * Båda mappingar är STUBS — verklig implementation kommer post-AB när
 * Google OAuth-app är registrerad och data faktiskt flödar.
 */

export type GoogleCalendarEvent = {
  id: string
  summary?: string
  start: { dateTime?: string; date?: string; timeZone?: string }
  end: { dateTime?: string; date?: string; timeZone?: string }
  status?: string
  organizer?: { email?: string }
  attendees?: Array<{ email?: string; responseStatus?: string }>
  [k: string]: unknown
}

export type GmailThreadMeta = {
  id: string
  historyId?: string
  snippet?: string
  labelIds?: string[]
  // Headers extraherade från message.payload.headers (From, To, Subject, Date)
  from?: string
  to?: string
  subject?: string
  internalDate?: string // millisecond timestamp som string
  [k: string]: unknown
}

export function calendarEventToSelvraEvent(
  ev: GoogleCalendarEvent,
): CreateEventRequest {
  return {
    category: 'data_ingested',
    event_type: 'google.calendar.event_observed',
    source_ai_id: 'google_calendar',
    payload: {
      google_event_id: ev.id,
      summary: ev.summary ?? null,
      start: ev.start,
      end: ev.end,
      status: ev.status ?? null,
      organizer_email: ev.organizer?.email ?? null,
      attendee_count: ev.attendees?.length ?? 0,
    },
    metadata: {
      mapper_version: 'v0.1',
    },
  }
}

export function gmailThreadToSelvraEvent(
  meta: GmailThreadMeta,
): CreateEventRequest {
  return {
    category: 'data_ingested',
    event_type: 'google.gmail.thread_observed',
    source_ai_id: 'google_gmail',
    payload: {
      gmail_thread_id: meta.id,
      from: meta.from ?? null,
      to: meta.to ?? null,
      subject: meta.subject ?? null,
      label_ids: meta.labelIds ?? [],
      internal_date: meta.internalDate ?? null,
      // Snippet är 200 char preview av body — i metadata-scope tillåts vi
      // se det. Behåll som lägsta-friktion-context utan att läsa
      // full email body.
      snippet: meta.snippet ?? null,
    },
    metadata: {
      mapper_version: 'v0.1',
      scope: 'gmail.metadata',
    },
  }
}
