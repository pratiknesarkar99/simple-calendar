/**
 * modal.js
 * Owns the modal lifecycle: open, close, reset, form reading,
 * and wiring the save/delete buttons to events.js.
 *
 * Two public entry points:
 *   openModalForNew(dateString?)  → add mode
 *   openModalForEdit(event)       → edit mode, all fields pre-filled
 */

import { state } from './state.js';
import { createEvent, updateEvent, deleteEvent } from './events.js';
import { getBaseEventId } from './recurrence.js';

// ─── DOM References ────────────────────────────────────────────────────────
const dom = {
  modalOverlay: document.getElementById('modal-overlay'),
  modalTitle: document.getElementById('modal-title'),
  inputTitle: document.getElementById('input-title'),
  inputDate: document.getElementById('input-date'),
  inputTime: document.getElementById('input-time'),
  inputReminder: document.getElementById('input-reminder'),
  colorPalette: document.getElementById('color-palette'),
  btnDeleteEvent: document.getElementById('btn-delete-event'),
  btnSaveEvent: document.getElementById('btn-save-event'),
  btnCancel: document.getElementById('btn-cancel'),
  btnModalClose: document.getElementById('btn-modal-close'),
  inputRecurrence: document.getElementById('input-recurrence'),
  inputRecurrenceEnd: document.getElementById('input-recurrence-end'),
  recurrenceEndGroup: document.getElementById('recurrence-end-group'),
};


// ─── Internal Helpers ──────────────────────────────────────────────────────

function resetModal() {
  dom.modalTitle.textContent = 'New Event';
  dom.inputTitle.value = '';
  dom.inputDate.value = '';
  dom.inputTime.value = '';
  dom.inputReminder.value = '';
  dom.inputRecurrence.value = '';
  dom.inputRecurrenceEnd.value = '';
  dom.recurrenceEndGroup.style.display = 'none';
  dom.btnDeleteEvent.style.display = 'none';
  state.editingEventId = null;

  state.selectedColor = '#4f86f7';
  syncColorSwatches();
}

function syncColorSwatches() {
  document.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.classList.toggle('selected', swatch.dataset.color === state.selectedColor);
  });
}

function showModal() {
  dom.modalOverlay.classList.add('open');
  dom.modalOverlay.setAttribute('aria-hidden', 'false');
  setTimeout(() => dom.inputTitle.focus(), 50);
}

function readFormValues() {
  return {
    title: dom.inputTitle.value.trim(),
    date: dom.inputDate.value,
    time: dom.inputTime.value,
    color: state.selectedColor,
    reminder: dom.inputReminder.value,
    recurrence: dom.inputRecurrence.value || null,
    recurrenceEnd: dom.inputRecurrenceEnd.value || null,
  };
}

/** Shake an input and briefly highlight it red on validation failure. */
function shakeInput(input) {
  input.classList.add('input-error');
  input.focus();
  setTimeout(() => input.classList.remove('input-error'), 600);
}

function handleSave() {
  const values = readFormValues();

  if (!values.title) { shakeInput(dom.inputTitle); return; }
  if (!values.date) { shakeInput(dom.inputDate); return; }

  if (state.editingEventId) {
    updateEvent(state.editingEventId, values);
  } else {
    createEvent(values);
  }

  closeModal();
}

function handleDelete() {
  if (!state.editingEventId) return;
  deleteEvent(state.editingEventId);
  closeModal();
}


// ─── Public API ────────────────────────────────────────────────────────────

export function closeModal() {
  dom.modalOverlay.classList.remove('open');
  dom.modalOverlay.setAttribute('aria-hidden', 'true');
  resetModal();
}

/** Open in add mode. Optionally pre-fills the date field. */
export function openModalForNew(dateString = '') {
  resetModal();
  if (dateString) dom.inputDate.value = dateString;
  showModal();
}

/** Open in edit mode with all fields pre-filled from the event. */
export function openModalForEdit(event) {
  resetModal();

  // If this is a recurring occurrence, resolve to the base event for editing.
  // Editing always applies to the base record, which updates all occurrences.
  const baseId = getBaseEventId(event.id);
  const baseEvent = baseId !== event.id
    ? (state.events.find(ev => ev.id === baseId) || event)
    : event;

  dom.modalTitle.textContent = 'Edit Event';
  dom.btnDeleteEvent.style.display = 'block';
  state.editingEventId = baseEvent.id;
  dom.inputTitle.value = baseEvent.title;
  dom.inputDate.value = baseEvent.date;
  dom.inputTime.value = baseEvent.time || '';
  dom.inputReminder.value = baseEvent.reminder || '';
  state.selectedColor = baseEvent.color;

  // Pre-fill recurrence fields
  if (baseEvent.recurrence) {
    dom.inputRecurrence.value = baseEvent.recurrence;
    dom.recurrenceEndGroup.style.display = 'block';
    dom.inputRecurrenceEnd.value = baseEvent.recurrenceEnd || '';
  }

  syncColorSwatches();
  showModal();
}

/** Wire all modal-related event listeners. Called once from app.js. */
export function bindModalEvents() {
  dom.btnSaveEvent.addEventListener('click', handleSave);
  dom.btnDeleteEvent.addEventListener('click', handleDelete);
  dom.btnModalClose.addEventListener('click', closeModal);
  dom.btnCancel.addEventListener('click', closeModal);

  dom.modalOverlay.addEventListener('click', (e) => {
    if (e.target === dom.modalOverlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dom.modalOverlay.classList.contains('open')) {
      closeModal();
    }
  });

  // Show/hide the end date field based on whether recurrence is selected
  dom.inputRecurrence.addEventListener('change', () => {
    const hasRecurrence = !!dom.inputRecurrence.value;
    dom.recurrenceEndGroup.style.display = hasRecurrence ? 'block' : 'none';
    if (!hasRecurrence) dom.inputRecurrenceEnd.value = '';
  });

  dom.colorPalette.addEventListener('click', (e) => {
    const swatch = e.target.closest('.color-swatch');
    if (!swatch) return;
    state.selectedColor = swatch.dataset.color;
    syncColorSwatches();
  });
}