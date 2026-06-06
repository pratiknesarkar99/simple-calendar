/**
 * recurrence.js
 * Expands recurring event rules into concrete occurrences for a
 * given date window. This is the core algorithm for recurring events.
 *
 * Key design decisions:
 *
 * 1. We NEVER store individual occurrences. Only the base event is
 *    stored with a recurrence rule. Occurrences are computed at
 *    render time for the visible window only.
 *
 * 2. Virtual occurrences carry a composite ID: "{baseId}_{date}".
 *    This lets click handlers and export identify the base event
 *    while distinguishing individual occurrences visually.
 *
 * 3. Supported rules: "weekly" and "monthly" only.
 *    Weekly  → same day of week, every 7 days from the base date.
 *    Monthly → same day of month, every calendar month from base date.
 *
 * 4. recurrenceEnd is an inclusive end date (YYYY-MM-DD string).
 *    If absent, the recurrence continues indefinitely (we just stop
 *    generating beyond the requested window).
 */

import { state } from './state.js';
import { toDateString } from './utils.js';

/**
 * Generate all occurrence dates for a recurring event within [windowStart, windowEnd].
 * Returns an array of YYYY-MM-DD strings.
 *
 * @param {object} event       - The base event with recurrence fields
 * @param {Date}   windowStart - Start of the visible date range (inclusive)
 * @param {Date}   windowEnd   - End of the visible date range (inclusive)
 */
function getOccurrencesInWindow(event, windowStart, windowEnd) {
    const [y, m, d] = event.date.split('-').map(Number);
    const baseDate = new Date(y, m - 1, d);
    const endDate = event.recurrenceEnd
        ? (() => { const [ey, em, ed] = event.recurrenceEnd.split('-').map(Number); return new Date(ey, em - 1, ed); })()
        : null;

    const occurrences = [];

    if (event.recurrence === 'weekly') {
        // Step forward 7 days at a time starting from the base date
        const cursor = new Date(baseDate);

        // Fast-forward to the window start if base is before it
        while (cursor < windowStart) {
            cursor.setDate(cursor.getDate() + 7);
        }

        while (cursor <= windowEnd) {
            if (endDate && cursor > endDate) break;
            occurrences.push(toDateString(cursor));
            cursor.setDate(cursor.getDate() + 7);
        }

    } else if (event.recurrence === 'monthly') {
        // Same day of month each month. Handles months where the day
        // doesn't exist (e.g. Jan 31 → skip Feb, land on Mar 31) by
        // checking that the resulting date still has the same day number.
        const targetDay = baseDate.getDate();
        const cursor = new Date(baseDate);

        // Fast-forward to the window start month
        while (cursor < windowStart) {
            cursor.setMonth(cursor.getMonth() + 1);
            // If the month rolled over (e.g. Jan 31 → Mar 3), rewind to 1st
            // and keep stepping until we land on the right day or pass it
            if (cursor.getDate() !== targetDay) {
                cursor.setDate(0); // last day of previous month
            }
        }

        while (cursor <= windowEnd) {
            if (endDate && cursor > endDate) break;
            // Only add if it lands on the correct day of month
            if (cursor.getDate() === targetDay) {
                occurrences.push(toDateString(cursor));
            }
            cursor.setMonth(cursor.getMonth() + 1);
            if (cursor.getDate() !== targetDay) {
                cursor.setDate(0);
            }
        }
    }

    return occurrences;
}

/**
 * Build a virtual occurrence object from a base event and a specific date.
 * The composite ID "{baseId}_{date}" lets the UI trace back to the base.
 */
function makeOccurrence(baseEvent, dateString) {
    return {
        ...baseEvent,
        id: `${baseEvent.id}_${dateString}`,
        date: dateString,
        isOccurrence: true,       // flag so UI knows this isn't the stored base
        baseId: baseEvent.id,
    };
}

/**
 * Main expansion function. Returns all events (one-time + recurring
 * occurrences) that fall within the given date window.
 *
 * Used by renderer.js (for display) and export.js (for .ics generation).
 *
 * @param {Date} windowStart
 * @param {Date} windowEnd
 * @returns {object[]} Flat array of event objects ready for rendering
 */
export function getVisibleEvents(windowStart, windowEnd) {
    const result = [];

    state.events.forEach(event => {
        if (!event.recurrence) {
            // One-time event: include only if it falls within the window
            const [ey, em, ed] = event.date.split('-').map(Number);
            const eventDate = new Date(ey, em - 1, ed);
            if (eventDate >= windowStart && eventDate <= windowEnd) {
                result.push(event);
            }
        } else {
            // Recurring event: expand occurrences for the window
            const dates = getOccurrencesInWindow(event, windowStart, windowEnd);
            dates.forEach(date => result.push(makeOccurrence(event, date)));
        }
    });

    return result;
}

/**
 * Given a composite occurrence ID, return the base event ID.
 * e.g. "abc-123_2026-06-12" → "abc-123"
 * Non-occurrence IDs are returned unchanged.
 */
export function getBaseEventId(id) {
    const underscoreIndex = id.lastIndexOf('_');
    if (underscoreIndex === -1) return id;
    // Validate that the suffix looks like a date (YYYY-MM-DD)
    const suffix = id.slice(underscoreIndex + 1);
    return /^\d{4}-\d{2}-\d{2}$/.test(suffix) ? id.slice(0, underscoreIndex) : id;
}