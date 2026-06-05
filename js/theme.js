/**
 * theme.js
 * Light/dark theme toggle. Switches by toggling body.light-theme,
 * which overrides the CSS custom properties defined in style.css.
 * Preference is persisted via storage.js.
 */

import { saveTheme, loadThemePreference } from './storage.js';

function applyTheme(theme) {
  const isLight = theme === 'light';
  document.body.classList.toggle('light-theme', isLight);
  const btn = document.getElementById('btn-theme');
  if (btn) btn.textContent = isLight ? '☾' : '☀';
  saveTheme(theme);
}

function toggleTheme() {
  const current = document.body.classList.contains('light-theme') ? 'light' : 'dark';
  applyTheme(current === 'light' ? 'dark' : 'light');
}

export function initTheme() {
  applyTheme(loadThemePreference());
  document.getElementById('btn-theme')?.addEventListener('click', toggleTheme);
}
