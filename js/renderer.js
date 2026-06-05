/**
 * renderer.js
 * All DOM rendering lives here: month grid, week grid, DOW labels,
 * and event chips. No business logic, no state mutations.
 *
 * The two-pass approach:
 *   1. renderMonthGrid() or renderWeekGrid() builds the cell structure.
 *   2. renderEventChips() places event chips into the built cells.
 *
 * render() is the single public entry point that orchestrates both passes.
 */

import { state } from './state.js';
import {
  getDaysInMonth,
  getFirstDayOfMonth,
  getWeekStart,
  toDateString,
  isSameDay,
  formatMonthLabel,
  formatWeekLabel,
  formatTime,
} from './utils.js';

// ─── DOM References ────────────────────────────────────────────────────────
const dom = {
  currentPeriodLabel: document.getElementById('current-period-label'),
  calendarGrid:       document.getElementById('calendar-grid'),
  dowLabels:          document.getElementById('dow-labels'),
  calendarContainer:  document.getElementById('calendar-container'),
};


// ─── DOW Label Renderers ───────────────────────────────────────────────────

function renderDowLabelsMonth() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dom.dowLabels.innerHTML = days.map(d => `<span>${d}</span>`).join('');
}

function renderDowLabelsWeek(weekStart) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dom.dowLabels.innerHTML = days.map((d, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    const highlight = isSameDay(date, state.today) ? 'dow-today' : '';
    return `<span class="${highlight}">${d} <strong>${date.getDate()}</strong></span>`;
  }).join('');
}


// ─── Month Grid ────────────────────────────────────────────────────────────

function renderMonthGrid() {
  const year  = state.activeDate.getFullYear();
  const month = state.activeDate.getMonth();

  const daysInMonth   = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);
  const totalCells    = Math.ceil((firstDayIndex + daysInMonth) / 7) * 7;
  const prevMonthDays = getDaysInMonth(year, month - 1 < 0 ? 11 : month - 1);

  dom.currentPeriodLabel.textContent = formatMonthLabel(state.activeDate);
  dom.calendarGrid.innerHTML = '';

  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement('div');
    cell.classList.add('day-cell');

    let cellDate;

    if (i < firstDayIndex) {
      const prevDay   = prevMonthDays - (firstDayIndex - 1 - i);
      const prevMonth = month - 1 < 0 ? 11 : month - 1;
      const prevYear  = month - 1 < 0 ? year - 1 : year;
      cellDate = new Date(prevYear, prevMonth, prevDay);
      cell.classList.add('outside-month');

    } else if (i < firstDayIndex + daysInMonth) {
      cellDate = new Date(year, month, i - firstDayIndex + 1);
      if (isSameDay(cellDate, state.today)) cell.classList.add('today');

    } else {
      const nextMonth = month + 1 > 11 ? 0 : month + 1;
      const nextYear  = month + 1 > 11 ? year + 1 : year;
      cellDate = new Date(nextYear, nextMonth, i - firstDayIndex - daysInMonth + 1);
      cell.classList.add('outside-month');
    }

    cell.dataset.date = toDateString(cellDate);

    const numberEl = document.createElement('span');
    numberEl.classList.add('day-cell__number');
    numberEl.textContent = cellDate.getDate();
    cell.appendChild(numberEl);

    dom.calendarGrid.appendChild(cell);
  }
}


// ─── Week Grid ─────────────────────────────────────────────────────────────

function renderWeekGrid() {
  const weekStart = getWeekStart(state.activeDate);

  dom.currentPeriodLabel.textContent = formatWeekLabel(weekStart);
  renderDowLabelsWeek(weekStart);
  dom.calendarGrid.innerHTML = '';
  dom.calendarContainer.classList.add('week-view');

  for (let i = 0; i < 7; i++) {
    const cellDate = new Date(weekStart);
    cellDate.setDate(cellDate.getDate() + i);

    const cell = document.createElement('div');
    cell.classList.add('day-cell', 'day-cell--week');
    cell.dataset.date = toDateString(cellDate);
    if (isSameDay(cellDate, state.today)) cell.classList.add('today');

    const numberEl = document.createElement('span');
    numberEl.classList.add('day-cell__number', 'day-cell__number--hidden');
    numberEl.textContent = cellDate.getDate();
    cell.appendChild(numberEl);

    dom.calendarGrid.appendChild(cell);
  }
}


// ─── Event Chips ───────────────────────────────────────────────────────────

function buildChip(event, isWeekView) {
  const chip = document.createElement('div');
  chip.classList.add('event-chip');
  chip.dataset.eventId = event.id;
  chip.style.background = event.color;
  chip.draggable = true;

  if (isWeekView) {
    chip.classList.add('event-chip--week');
    const titleEl = document.createElement('span');
    titleEl.textContent = event.title;
    chip.appendChild(titleEl);

    if (event.time) {
      const timeEl = document.createElement('span');
      timeEl.classList.add('event-chip__time');
      timeEl.textContent = formatTime(event.time);
      chip.appendChild(timeEl);
    }
  } else {
    chip.textContent = event.title;
  }

  return chip;
}

function renderEventChips() {
  const isWeekView = state.activeView === 'week';

  // Sort events by time before rendering so chips appear in order
  const sorted = [...state.events].sort((a, b) => {
    return (a.time || '00:00').localeCompare(b.time || '00:00');
  });

  sorted.forEach(event => {
    const cell = dom.calendarGrid.querySelector(`[data-date="${event.date}"]`);
    if (!cell) return;
    cell.appendChild(buildChip(event, isWeekView));
  });
}


// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Main render entry point. Called after any state change.
 * Orchestrates the two-pass render: grid cells, then chips.
 */
export function render() {
  if (state.activeView === 'month') {
    dom.calendarContainer.classList.remove('week-view');
    renderDowLabelsMonth();
    renderMonthGrid();
  } else {
    renderWeekGrid();
  }
  renderEventChips();
}

/**
 * Sync the active class on view toggle buttons to match state.activeView.
 * Called by navigation handlers after changing the view.
 */
export function updateViewToggleButtons() {
  document.querySelectorAll('.view-toggle__btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === state.activeView);
  });
}

/** Expose the grid element so dragdrop.js can attach listeners to it. */
export function getCalendarGrid() {
  return dom.calendarGrid;
}
