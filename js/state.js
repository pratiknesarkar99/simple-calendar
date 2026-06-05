/**
 * state.js
 * Single source of truth for the entire app.
 *
 * Rules:
 *   - Import this object wherever you need to read state.
 *   - Mutate it only through the dedicated functions in events.js
 *     and storage.js, never by reaching into it arbitrarily.
 *   - Never import app.js or other high-level modules from here.
 *     This module sits at the bottom of the dependency graph.
 */

export const state = {
  today:          new Date(),      // fixed reference, never mutated
  activeDate:     new Date(),      // the month/week currently in view
  activeView:     'month',         // 'month' | 'week'
  events:         [],              // loaded from localStorage on init
  selectedColor:  '#4f86f7',       // active color selection in the modal
  editingEventId: null,            // null = add mode, string = edit mode
};
