/**
 * dragdrop.js
 * HTML5 Drag and Drop bindings for moving events between dates.
 *
 * All four drag lifecycle events are delegated to the grid container
 * so they work on dynamically rendered chips without re-binding.
 *
 * When an event is dropped on an outside-month padding cell, the
 * event moves to that date and the view navigates to that month.
 */

import { state } from './state.js';
import { moveEvent } from './events.js';
import { render, updateViewToggleButtons, getCalendarGrid } from './renderer.js';

let dragOverCell = null;

function clearDragHighlight() {
  if (dragOverCell) {
    dragOverCell.classList.remove('drag-over');
    dragOverCell = null;
  }
}

export function bindDragAndDrop() {
  const grid = getCalendarGrid();

  grid.addEventListener('dragstart', (e) => {
    const chip = e.target.closest('.event-chip');
    if (!chip) return;
    e.dataTransfer.setData('text/plain', chip.dataset.eventId);
    e.dataTransfer.effectAllowed = 'move';
    // Defer fade so browser captures the un-faded version as the ghost image
    setTimeout(() => chip.classList.add('dragging'), 0);
  });

  grid.addEventListener('dragend', (e) => {
    const chip = e.target.closest('.event-chip');
    if (chip) chip.classList.remove('dragging');
    clearDragHighlight();
  });

  grid.addEventListener('dragover', (e) => {
    const cell = e.target.closest('.day-cell');
    if (!cell) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (dragOverCell !== cell) {
      clearDragHighlight();
      dragOverCell = cell;
      cell.classList.add('drag-over');
    }
  });

  grid.addEventListener('dragleave', (e) => {
    const cell = e.target.closest('.day-cell');
    if (cell && !cell.contains(e.relatedTarget)) {
      cell.classList.remove('drag-over');
      if (dragOverCell === cell) dragOverCell = null;
    }
  });

  grid.addEventListener('drop', (e) => {
    e.preventDefault();
    clearDragHighlight();

    const cell = e.target.closest('.day-cell');
    if (!cell) return;

    const eventId   = e.dataTransfer.getData('text/plain');
    const newDate   = cell.dataset.date;
    const isOutside = cell.classList.contains('outside-month');

    // moveEvent is a no-op if the date hasn't changed
    moveEvent(eventId, newDate);

    // Navigate to the outside month if needed
    if (isOutside) {
      const [y, m, d] = newDate.split('-').map(Number);
      state.activeDate = new Date(y, m - 1, d);
      state.activeView = 'month';
      updateViewToggleButtons();
      render();
    }
  });
}
