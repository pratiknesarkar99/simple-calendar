/**
 * storage.js
 * All localStorage reads and writes go through here.
 * Nothing else in the app touches localStorage directly.
 *
 * Keeping I/O isolated means you could swap localStorage for
 * IndexedDB or a remote API later by changing only this file.
 */

import { state } from './state.js';

const EVENTS_KEY = 'calendar_events';
const THEME_KEY  = 'calendar_theme';

/**
 * Serialize state.events to JSON and write to localStorage.
 * Called after every create, update, or delete operation.
 */
export function saveEvents() {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(state.events));
}

/**
 * Load events from localStorage into state.events.
 * Falls back to an empty array on first load or corrupted data.
 */
export function loadEvents() {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    state.events = raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Failed to parse stored events, resetting.', e);
    state.events = [];
  }
}

/** Persist the current theme preference. */
export function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

/** Read the saved theme, defaulting to 'dark'. */
export function loadThemePreference() {
  return localStorage.getItem(THEME_KEY) || 'dark';
}
