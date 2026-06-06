/**
 * export.js
 * Generates an iCalendar (.ics) file from the events in the current
 * visible month and triggers a browser download.
 *
 * The .ics format (RFC 5545) is a plain-text standard supported by
 * Google Calendar, Apple Calendar, Outlook, and every other major
 * calendar application. No library needed to generate it.
 *
 * Scope: exports only events in the currently viewed month.
 * Recurring event base records are expanded to their occurrences
 * before export so imported calendars show the actual instances.
 */

import { state } from './state.js';
import { getVisibleEvents } from './recurrence.js';

/**
 * Format a YYYY-MM-DD + HH:MM pair into an iCal DATETIME string.
 * e.g. "2026-06-05" + "14:30" → "20260605T143000"
 * All-day events use DATE format only: "20260605"
 */
function toICalDate(dateStr, timeStr) {
    const datePart = dateStr.replace(/-/g, '');
    if (!timeStr) return datePart;
    const timePart = timeStr.replace(':', '') + '00';
    return `${datePart}T${timePart}`;
}

/**
 * Escape special characters in iCal text fields.
 * Commas, semicolons, and backslashes must be escaped per RFC 5545.
 */
function escapeICalText(str) {
    return str
        .replace(/\\/g, '\\\\')
        .replace(/,/g, '\\,')
        .replace(/;/g, '\\;')
        .replace(/\n/g, '\\n');
}

/**
 * Build a single VEVENT block string from an event object.
 */
function buildVEvent(event) {
    const dtStart = toICalDate(event.date, event.time);
    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const lines = [
        'BEGIN:VEVENT',
        `UID:${event.id}@calendar-app`,
        `DTSTAMP:${now}`,
        `DTSTART:${dtStart}`,
        `SUMMARY:${escapeICalText(event.title)}`,
    ];

    // Add an DTEND 1 hour after start if time is set, else treat as all-day
    if (event.time) {
        const [h, m] = event.time.split(':').map(Number);
        const endHour = String(h + 1).padStart(2, '0');
        const endMin = String(m).padStart(2, '0');
        const dtEnd = toICalDate(event.date, `${endHour}:${endMin}`);
        lines.push(`DTEND:${dtEnd}`);
    }

    // Add a VALARM block if a reminder is set
    if (event.reminder) {
        lines.push(
            'BEGIN:VALARM',
            'ACTION:DISPLAY',
            `DESCRIPTION:Reminder: ${escapeICalText(event.title)}`,
            `TRIGGER:-PT${event.reminder}M`,
            'END:VALARM'
        );
    }

    lines.push('END:VEVENT');
    return lines.join('\r\n');
}

/**
 * Build the full VCALENDAR string from an array of events.
 */
function buildICalString(events) {
    const vEvents = events.map(buildVEvent).join('\r\n');
    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Calendar App//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        vEvents,
        'END:VCALENDAR',
    ].join('\r\n');
}

/**
 * Trigger a file download in the browser without any server involved.
 * Creates a temporary object URL, clicks it, then cleans up.
 */
function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);   // free memory
}

/**
 * Main export function. Filters events to the current visible month,
 * expands recurring events, builds the .ics string, and downloads it.
 */
export function exportCurrentMonth() {
    const year = state.activeDate.getFullYear();
    const month = state.activeDate.getMonth();

    // Build the date window for the current month
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    // getVisibleEvents expands recurring events into their occurrences
    const events = getVisibleEvents(monthStart, monthEnd);

    if (events.length === 0) {
        alert('No events in the current month to export.');
        return;
    }

    const icalStr = buildICalString(events);
    const label = monthStart.toLocaleString('default', { month: 'long', year: 'numeric' });
    const filename = `calendar-${year}-${String(month + 1).padStart(2, '0')}.ics`;

    downloadFile(icalStr, filename);
    console.log(`Exported ${events.length} event(s) for ${label}`);
}

/** Wire the export button. Called once from app.js. */
export function bindExportEvent() {
    document.getElementById('btn-export')?.addEventListener('click', exportCurrentMonth);
}