/**
 * app.js
 * Entry point. Imports and initializes every module.
 * This file should contain NO business logic of its own.
 * Its only job is to wire things together and call init functions.
 *
 * Reading this file should give you a complete map of the app:
 * what modules exist, what order they initialize in, and why.
 */

import { state } from './state.js';
import { loadEvents } from './storage.js';
import { render, updateViewToggleButtons, getCalendarGrid } from './renderer.js';
import { bindModalEvents, openModalForNew, openModalForEdit } from './modal.js';
import { findEventById } from './events.js';
import { bindDragAndDrop } from './dragdrop.js';
import { initReminders } from './reminders.js';
import { initTheme } from './theme.js';
import { getWeekStart } from './utils.js';
import { bindExportEvent } from './export.js';
import { getBaseEventId } from './recurrence.js';


// ─── Navigation ────────────────────────────────────────────────────────────

function goToPrev() {
  if (state.activeView === 'month') {
    const d = state.activeDate;
    state.activeDate = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  } else {
    const ws = getWeekStart(state.activeDate);
    ws.setDate(ws.getDate() - 7);
    state.activeDate = ws;
  }
  render();
}

function goToNext() {
  if (state.activeView === 'month') {
    const d = state.activeDate;
    state.activeDate = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  } else {
    const ws = getWeekStart(state.activeDate);
    ws.setDate(ws.getDate() + 7);
    state.activeDate = ws;
  }
  render();
}

function goToToday() {
  state.activeDate = new Date(state.today);
  state.activeView = 'month';
  updateViewToggleButtons();
  render();
}

function setView(view) {
  state.activeView = view;
  updateViewToggleButtons();
  render();
}


// ─── Event Listeners ───────────────────────────────────────────────────────

function bindNavigationEvents() {
  document.getElementById('btn-prev').addEventListener('click', goToPrev);
  document.getElementById('btn-next').addEventListener('click', goToNext);
  document.getElementById('btn-today').addEventListener('click', goToToday);
  document.querySelectorAll('.view-toggle__btn').forEach(btn => {
    btn.addEventListener('click', () => setView(btn.dataset.view));
  });
}

function bindGridClickEvents() {
  const grid = getCalendarGrid();

  grid.addEventListener('click', (e) => {
    const chip = e.target.closest('.event-chip');
    if (chip) {
      // chip may carry a composite occurrence ID (baseId_date).
      // Pass the raw event object from the chip; openModalForEdit
      // in modal.js resolves it to the base event for editing.
      const chipId = chip.dataset.eventId;
      const baseId = getBaseEventId(chipId);
      const event = findEventById(baseId);
      if (event) openModalForEdit(event);
      return;
    }

    const cell = e.target.closest('.day-cell');
    if (cell) openModalForNew(cell.dataset.date);
  });
}

function bindAddButtonEvent() {
  document.getElementById('btn-add-event').addEventListener('click', () => {
    openModalForNew();
  });
}


// ─── Init ──────────────────────────────────────────────────────────────────

function init() {
  initTheme();           // Apply saved theme before first paint (no flash)
  loadEvents();          // Hydrate state.events from localStorage
  bindNavigationEvents();
  bindModalEvents();
  bindGridClickEvents();
  bindAddButtonEvent();
  bindDragAndDrop();
  bindExportEvent();
  initReminders();
  render();              // First render with all state hydrated
}

init();