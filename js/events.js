/**
 * events.js
 * All event CRUD operations. Each function mutates state.events,
 * persists to storage, and triggers a re-render.
 *
 * This is the only module that should push, splice, or filter
 * state.events. Everything else reads it.
 */

import { state } from './state.js';
import { saveEvents } from './storage.js';
import { render } from './renderer.js';

/**
 * Add a new event to state and persist it.
 * The caller (modal.js) is responsible for validation before calling this.
 */
export function createEvent({ title, date, time, color, reminder }) {
  const event = {
    id:       crypto.randomUUID(),
    title,
    date,
    time,
    color,
    reminder,
  };
  state.events.push(event);
  saveEvents();
  render();
}

/**
 * Update an existing event by ID.
 * Uses spread to preserve the original id and any future fields.
 */
export function updateEvent(id, { title, date, time, color, reminder }) {
  const index = state.events.findIndex(ev => ev.id === id);
  if (index === -1) return;
  state.events[index] = {
    ...state.events[index],
    title,
    date,
    time,
    color,
    reminder,
  };
  saveEvents();
  render();
}

/**
 * Remove an event by ID. Returns the deleted event for potential undo
 * support in the future (not implemented, but good to return it).
 */
export function deleteEvent(id) {
  const deleted = state.events.find(ev => ev.id === id);
  state.events = state.events.filter(ev => ev.id !== id);
  saveEvents();
  render();
  return deleted;
}

/**
 * Move an event to a new date (used by drag and drop).
 * A thin wrapper over updateEvent that only changes the date field.
 */
export function moveEvent(id, newDate) {
  const event = state.events.find(ev => ev.id === id);
  if (!event || event.date === newDate) return;
  updateEvent(id, { ...event, date: newDate });
}

/** Find a single event by ID. Returns undefined if not found. */
export function findEventById(id) {
  return state.events.find(ev => ev.id === id);
}
