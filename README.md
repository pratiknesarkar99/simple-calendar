# Calendar App

A fully client-side calendar application built with plain HTML, CSS, and vanilla JavaScript. No frameworks, no build tools, no dependencies. Open a terminal, serve the folder, and it works.

![Calendar App](https://img.shields.io/badge/vanilla-JS-yellow) ![No Dependencies](https://img.shields.io/badge/dependencies-none-brightgreen) ![ES Modules](https://img.shields.io/badge/modules-ES%20Modules-blue)

---

## Features

- **Month and week views** with smooth navigation between periods
- **Create, edit, and delete events** with title, date, time, and color tagging
- **Drag and drop** events between dates; dragging to an adjacent month navigates automatically
- **Reminders** via browser notifications at 5, 15, 30, or 60 minutes before an event
- **Light and dark theme** toggle with preference persisted across sessions
- **localStorage persistence** so events survive page refreshes and browser restarts

---

## Project Structure

```
calendar/
├── index.html          # App shell and modal markup
├── style.css           # Design tokens, layout, component styles, themes
└── js/
    ├── app.js          # Entry point: wires all modules together
    ├── state.js        # Single source of truth for app state
    ├── storage.js      # All localStorage reads and writes
    ├── utils.js        # Pure date helper functions (no side effects)
    ├── renderer.js     # DOM rendering: month grid, week grid, event chips
    ├── events.js       # CRUD operations: create, update, delete, move
    ├── modal.js        # Modal lifecycle and form handling
    ├── dragdrop.js     # HTML5 Drag and Drop bindings
    ├── reminders.js    # Browser notification polling
    └── theme.js        # Light/dark theme toggle and persistence
```

Each module owns a single concern and exports only what other modules need. `state.js` sits at the bottom of the dependency graph and is imported read-only by most modules. Mutations to state happen only through `events.js` and `storage.js`.

---

## Getting Started

### Prerequisites

No installs required beyond one of the following to run a local server:

- **Node.js** (any version) — for `npx serve`
- **Python 3** — comes pre-installed on macOS and most Linux distros

> **Why a local server?** ES Modules are blocked by browsers when loaded via `file://` due to CORS restrictions. You must serve the project over HTTP, even locally.

### Running Locally

**Option 1: Node.js**

```bash
cd path/to/calendar
npx serve .
# Open http://localhost:3000
```

**Option 2: Python**

```bash
cd path/to/calendar
python3 -m http.server 8000
# Open http://localhost:8000
```

**Option 3: VS Code**

Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension, right-click `index.html`, and select **Open with Live Server**.

---

## Deployment

This project requires no build step. The output of the repo is the deployable artifact.

### GitHub Pages

```bash
# Initialize a git repo if you haven't already
git init
git add .
git commit -m "Initial commit"

# Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/calendar.git
git push -u origin main
```

Then in your GitHub repository: **Settings → Pages → Source: Deploy from branch → Branch: main → Folder: / (root) → Save.**

Your app will be live at `https://YOUR_USERNAME.github.io/calendar` within a few minutes.

### Netlify

Drag and drop the project folder onto [netlify.com/drop](https://app.netlify.com/drop). You get a live URL instantly with no configuration.

### Vercel

```bash
npm install -g vercel
cd path/to/calendar
vercel
```

Follow the prompts. Your app is deployed on the first `vercel` command.

---

## Usage

### Adding an Event

Click the **+** button in the header, or click directly on any day cell. The modal opens with the date pre-filled if you clicked a cell. Fill in a title (required), date (required), time (optional), color, and reminder, then click **Save Event**.

### Editing an Event

Click any event chip on the calendar. The modal reopens in edit mode with all fields pre-filled. Make your changes and click **Save Event**.

### Deleting an Event

Open an event for editing by clicking its chip, then click the **Delete** button in the bottom-left of the modal.

### Dragging Events

Click and hold any event chip, then drag it to a different day cell. The target cell highlights with a dashed border during hover. Dropping on a padding cell from an adjacent month will move the event and navigate to that month automatically.

### Reminders

Set a reminder when creating or editing an event. The app will request browser notification permission on first use. Reminders fire within 30 seconds of their scheduled time while the tab is open.

> **Note:** Reminders only fire while the browser tab is open. Background notifications would require a Service Worker, which is not implemented in this project.

### Theme Toggle

Click the **☀** icon in the header to switch to light mode. Click **☾** to return to dark mode. The preference is saved and applied on every subsequent visit.

---

## Data Model

Each event is stored as a plain object in a JSON array under the `calendar_events` key in `localStorage`.

```json
{
  "id":       "a3f2c1d0-4e5b-6789-abcd-ef0123456789",
  "title":    "Team standup",
  "date":     "2026-06-05",
  "time":     "10:30",
  "color":    "#4f86f7",
  "reminder": "15"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | UUID generated via `crypto.randomUUID()` |
| `title` | string | yes | Event display name |
| `date` | string | yes | ISO date: `YYYY-MM-DD` |
| `time` | string | no | 24hr time: `HH:MM`. Empty string for all-day events |
| `color` | string | yes | Hex color from the preset palette |
| `reminder` | string | no | Minutes before event: `"5"`, `"15"`, `"30"`, or `"60"` |

Dates are stored as plain strings rather than `Date` objects to avoid JSON serialization issues and timezone-related date shifting.

---

## Module Dependency Graph

```
app.js
├── state.js
├── storage.js      → state.js
├── utils.js        (no dependencies)
├── renderer.js     → state.js, utils.js
├── events.js       → state.js, storage.js, renderer.js
├── modal.js        → state.js, events.js
├── dragdrop.js     → state.js, events.js, renderer.js, utils.js
├── reminders.js    → state.js, utils.js
└── theme.js        → storage.js
```

`utils.js` and `state.js` have no internal dependencies, making them safe to import anywhere without risk of circular references.

---

## Browser Support

| Browser | Support |
|---|---|
| Chrome 80+ | Full |
| Firefox 80+ | Full |
| Safari 14+ | Full |
| Edge 80+ | Full |

Requires support for ES Modules, `crypto.randomUUID()`, CSS custom properties, and the HTML5 Drag and Drop API. All are available in any browser released after 2020.

---

## Known Limitations

- **Reminders require an open tab.** A Service Worker would be needed for background delivery.
- **No recurring events.** Each event is a standalone entry.
- **No multi-day events.** Events belong to a single date.
- **Single user, local only.** There is no backend or sync. Data lives in the browser's localStorage and is not shared across devices.

---

## Built With

- HTML5
- CSS3 (custom properties, grid, flexbox)
- Vanilla JavaScript (ES Modules, native Drag and Drop API, Web Notifications API)
- [DM Sans](https://fonts.google.com/specimen/DM+Sans) and [DM Mono](https://fonts.google.com/specimen/DM+Mono) via Google Fonts

---

## License

MIT
