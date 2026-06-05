/**
 * utils.js
 * Pure date helper functions. No side effects, no DOM, no state.
 * Every function takes inputs and returns a value. Nothing else.
 *
 * This module can be imported by anything without risk of
 * circular dependencies or unexpected behavior.
 */

/** How many days are in a given month? */
export function getDaysInMonth(year, month) {
  // Day 0 of the next month = last day of this month
  return new Date(year, month + 1, 0).getDate();
}

/** What day of the week (0=Sun, 6=Sat) does this month start on? */
export function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

/**
 * Format a Date to YYYY-MM-DD string.
 * Built manually to avoid toISOString() timezone shift issues.
 * e.g. in UTC-5, new Date('2026-06-05').toISOString() returns
 * '2026-06-04T...' which is the wrong day.
 */
export function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Is a given Date object the same calendar day as another? */
export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  );
}

/**
 * Given any date, return the Sunday that starts its week.
 * getDay() returns 0 for Sunday, so subtracting it always snaps back.
 */
export function getWeekStart(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

/** Format as "June 2026" for the month view header. */
export function formatMonthLabel(date) {
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

/**
 * Format as "Jun 1 - Jun 7, 2026" for the week view header.
 * Handles the edge case where a week spans two years.
 */
export function formatWeekLabel(weekStart) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const opts = { month: 'short', day: 'numeric' };

  if (weekStart.getFullYear() !== weekEnd.getFullYear()) {
    return (
      weekStart.toLocaleString('default', { ...opts, year: 'numeric' }) +
      ' - ' +
      weekEnd.toLocaleString('default', { ...opts, year: 'numeric' })
    );
  }
  return (
    weekStart.toLocaleString('default', opts) +
    ' - ' +
    weekEnd.toLocaleString('default', { ...opts, year: 'numeric' })
  );
}

/**
 * Convert a 24hr time string to 12hr display format.
 * e.g. "14:30" -> "2:30 PM", "00:00" -> "12:00 AM"
 */
export function formatTime(timeString) {
  if (!timeString) return '';
  const [hourStr, minute] = timeString.split(':');
  const hour   = parseInt(hourStr, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute} ${period}`;
}
