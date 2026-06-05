/**
 * reminders.js
 * Polls every 30 seconds and fires browser Notifications when
 * an event's reminder window arrives.
 *
 * Limitation: notifications only fire while the tab is open.
 * Background delivery would require a Service Worker.
 *
 * firedReminders is a Set that prevents repeat notifications
 * within the same browser session.
 */

import { state } from './state.js';
import { formatTime } from './utils.js';

const firedReminders = new Set();

async function requestPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  return (await Notification.requestPermission()) === 'granted';
}

function checkReminders() {
  if (Notification.permission !== 'granted') return;

  const now = new Date();

  state.events.forEach(event => {
    if (!event.reminder || !event.time)      return;
    if (firedReminders.has(event.id))        return;

    const [y, mo, d]  = event.date.split('-').map(Number);
    const [hr, min]   = event.time.split(':').map(Number);
    const eventTime   = new Date(y, mo - 1, d, hr, min, 0);
    const offsetMs    = parseInt(event.reminder, 10) * 60 * 1000;
    const triggerTime = new Date(eventTime.getTime() - offsetMs);

    const diff = now - triggerTime;

    // Fire if we're within the 30-second polling window past the trigger
    if (diff >= 0 && diff < 30_000) {
      firedReminders.add(event.id);
      new Notification(`Reminder: ${event.title}`, {
        body: `Starting in ${event.reminder} minute${event.reminder === '1' ? '' : 's'} at ${formatTime(event.time)}`,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">📅</text></svg>',
      });
    }
  });
}

export async function initReminders() {
  await requestPermission();
  checkReminders();
  setInterval(checkReminders, 30_000);
}
