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
import { getVisibleEvents } from './recurrence.js';
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
  calendarGrid: document.getElementById('calendar-grid'),
  dowLabels: document.getElementById('dow-labels'),
  calendarContainer: document.getElementById('calendar-container'),
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
  const year = state.activeDate.getFullYear();
  const month = state.activeDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);
  const totalCells = Math.ceil((firstDayIndex + daysInMonth) / 7) * 7;
  const prevMonthDays = getDaysInMonth(year, month - 1 < 0 ? 11 : month - 1);

  dom.currentPeriodLabel.textContent = formatMonthLabel(state.activeDate);
  dom.calendarGrid.innerHTML = '';

  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement('div');
    cell.classList.add('day-cell');

    let cellDate;

    if (i < firstDayIndex) {
      const prevDay = prevMonthDays - (firstDayIndex - 1 - i);
      const prevMonth = month - 1 < 0 ? 11 : month - 1;
      const prevYear = month - 1 < 0 ? year - 1 : year;
      cellDate = new Date(prevYear, prevMonth, prevDay);
      cell.classList.add('outside-month');

    } else if (i < firstDayIndex + daysInMonth) {
      cellDate = new Date(year, month, i - firstDayIndex + 1);
      if (isSameDay(cellDate, state.today)) cell.classList.add('today');

    } else {
      const nextMonth = month + 1 > 11 ? 0 : month + 1;
      const nextYear = month + 1 > 11 ? year + 1 : year;
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



// ─── Current Time Indicator ────────────────────────────────────────────────
// Only shown in week view when the current week is being viewed.
// Positioned as a percentage of the day elapsed (0% = midnight, 100% = 11:59pm).

let timeIndicatorInterval = null;

/**
 * Is the currently viewed week the one that contains today?
 */
function isCurrentWeekVisible() {
  const weekStart = getWeekStart(state.activeDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const today = state.today;
  return today >= weekStart && today <= weekEnd;
}

/**
 * Calculate how far through the day we are as a percentage (0-100).
 * Used to position the indicator line vertically inside the today cell.
 */
function getDayProgressPercent() {
  const now = new Date();
  const elapsed = now.getHours() * 60 + now.getMinutes();
  return (elapsed / 1440) * 100;
}

/**
 * Inject or update the time indicator line inside today's week cell.
 * Safe to call repeatedly: removes any existing indicator before redrawing.
 */
function renderTimeIndicator() {
  // Clean up any existing indicator first
  dom.calendarGrid.querySelectorAll('.time-indicator').forEach(el => el.remove());

  if (state.activeView !== 'week' || !isCurrentWeekVisible()) return;

  const todayString = toDateString(state.today);
  const todayCell = dom.calendarGrid.querySelector(`[data-date="${todayString}"]`);
  if (!todayCell) return;

  const pct = getDayProgressPercent();
  const indicator = document.createElement('div');
  indicator.classList.add('time-indicator');
  indicator.style.top = `${pct}%`;

  // The dot on the left edge of the line
  const dot = document.createElement('div');
  dot.classList.add('time-indicator__dot');
  indicator.appendChild(dot);

  todayCell.appendChild(indicator);
}

/**
 * Start the 60-second update interval for the time indicator.
 * Clears any previous interval so this is safe to call on re-render.
 */
function startTimeIndicatorInterval() {
  if (timeIndicatorInterval) clearInterval(timeIndicatorInterval);
  timeIndicatorInterval = setInterval(renderTimeIndicator, 60_000);
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
    // Small loop icon on month chips to signal recurrence
    if (event.recurrence || event.isOccurrence) {
      const recurEl = document.createElement('span');
      recurEl.classList.add('event-chip__recur');
      recurEl.textContent = '↻';
      chip.appendChild(recurEl);
    }
  }

  return chip;
}

function renderEventChips() {
  const isWeekView = state.activeView === 'week';
  const year = state.activeDate.getFullYear();
  const month = state.activeDate.getMonth();

  // Define the visible date window so getVisibleEvents knows what to expand
  let windowStart, windowEnd;
  if (isWeekView) {
    windowStart = getWeekStart(state.activeDate);
    windowEnd = new Date(windowStart);
    windowEnd.setDate(windowEnd.getDate() + 6);
  } else {
    windowStart = new Date(year, month, 1);
    windowEnd = new Date(year, month + 1, 0);
  }

  // getVisibleEvents returns both one-time events and expanded recurring occurrences
  const events = getVisibleEvents(windowStart, windowEnd);

  // Sort by time so chips appear in chronological order within each cell
  const sorted = events.sort((a, b) =>
    (a.time || '00:00').localeCompare(b.time || '00:00')
  );

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
  renderTimeIndicator();      // No-op in month view or non-current weeks
  startTimeIndicatorInterval(); // Reset the 60s update cycle on every render
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