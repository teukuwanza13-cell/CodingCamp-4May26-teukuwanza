# Design Document — To-Do Life Dashboard

## Overview

A single-page, client-side productivity dashboard delivered as three static files:
`index.html`, `css/styles.css`, `js/app.js`. No build step, no framework, no network
requests. All state lives in `window.localStorage`. Four widgets — Greeting, Focus Timer,
To-Do List, Quick Links — share a responsive CSS Grid layout with a light/dark theme
toggle.

---

## Architecture

```
todo-life-dashboard/
├── index.html          # single HTML document; all markup
├── css/
│   └── styles.css      # all styles; CSS custom properties for theming
└── js/
    └── app.js          # all logic; module-pattern IIFEs per widget
```

No external dependencies. The browser loads `index.html`, which links the CSS and defers
the JS. Everything runs in a single global execution context; widgets are isolated by
naming convention (`greeting_*`, `timer_*`, `todo_*`, `links_*`, `storage_*`,
`theme_*`).

### Execution flow

```
DOMContentLoaded
  └─ storage.init()          // detect LocalStorage availability
  └─ theme.init()            // read + apply saved theme
  └─ greeting.init()         // render + start 60-s clock tick
  └─ timer.init()            // read saved duration, render display
  └─ todo.init()             // read saved tasks, render list
  └─ links.init()            // read saved links, render buttons
```

---

## Components and Interfaces

### 1. Storage module (`storage_*`)

Wraps `localStorage` with try/catch. Exposes:

| Function | Signature | Description |
|---|---|---|
| `storage_get(key)` | `(string) → any\|null` | JSON.parse on read; returns null on miss or error |
| `storage_set(key, value)` | `(string, any) → boolean` | JSON.stringify on write; returns false on error |
| `storage_available()` | `() → boolean` | one-time availability check |

On first call, if `localStorage` is unavailable, sets a module-level flag and shows the
warning banner (Requirement 6.2).

---

### 2. Theme module (`theme_*`)

| Function | Description |
|---|---|
| `theme_init()` | Reads `LD_THEME` key; applies `data-theme` attribute on `<html>` |
| `theme_toggle()` | Flips `data-theme`, saves to `LD_THEME` |

CSS reacts to `[data-theme="dark"]` selector on `<html>`.

---

### 3. Greeting module (`greeting_*`)

| Function | Description |
|---|---|
| `greeting_init()` | Renders time/date/greeting; starts `setInterval` (60 000 ms) |
| `greeting_render()` | Reads `new Date()`, updates DOM spans |
| `greeting_text(hour)` | Pure function: `number → string` greeting label |

No persistence.

---

### 4. Timer module (`timer_*`)

| Function | Description |
|---|---|
| `timer_init()` | Reads `LD_TIMER_DURATION`; sets `timer_remaining`; renders display |
| `timer_start()` | Starts `setInterval` (1 000 ms); disables Start, enables Stop |
| `timer_stop()` | Clears interval; enables Start, disables Stop |
| `timer_reset()` | Calls `timer_stop()`; restores `timer_remaining` to `timer_duration`; renders |
| `timer_tick()` | Decrements `timer_remaining`; renders; calls `timer_complete()` at 0 |
| `timer_complete()` | Calls `timer_stop()`; plays Web Audio alert |
| `timer_render()` | Formats `timer_remaining` as MM:SS; updates display element |
| `timer_set_duration(min)` | Validates 1–99; saves `LD_TIMER_DURATION`; calls `timer_reset()` |
| `timer_play_alert()` | Creates `AudioContext`; plays 880 Hz sine wave for 0.6 s |

Module-level state: `timer_duration` (minutes), `timer_remaining` (seconds),
`timer_interval_id`.

---

### 5. To-Do module (`todo_*`)

| Function | Description |
|---|---|
| `todo_init()` | Reads `LD_TASKS`; calls `todo_render_all()` |
| `todo_add()` | Validates input; checks duplicate; creates Task; saves; re-renders |
| `todo_delete(id)` | Removes Task by id; saves; re-renders |
| `todo_toggle(id)` | Flips `done`; saves; re-renders |
| `todo_edit_start(id)` | Replaces title span with `<input>` pre-filled with current title |
| `todo_edit_confirm(id)` | Validates; checks duplicate (excluding self); updates; saves; re-renders |
| `todo_edit_cancel(id)` | Restores title span without saving |
| `todo_sort(mode)` | Sorts in-memory array; re-renders (does not persist sort order) |
| `todo_render_all()` | Clears list container; renders each Task via `todo_render_item(task)` |
| `todo_render_item(task)` | Returns a `<li>` DOM node for one Task |
| `todo_save()` | Calls `storage_set(LD_TASKS, todo_tasks)` |
| `todo_validate(title, excludeId)` | Returns `{ok, error}` — checks empty + duplicate |

Module-level state: `todo_tasks` (array of Task objects), `todo_sort_mode` (string).

---

### 6. Links module (`links_*`)

| Function | Description |
|---|---|
| `links_init()` | Reads `LD_LINKS`; calls `links_render_all()` |
| `links_add()` | Validates label + URL; normalises URL; creates Quick_Link; saves; re-renders |
| `links_delete(id)` | Removes by id; saves; re-renders |
| `links_render_all()` | Clears container; renders each Quick_Link |
| `links_render_item(link)` | Returns a DOM node (button + delete icon) for one Quick_Link |
| `links_save()` | Calls `storage_set(LD_LINKS, links_list)` |
| `links_normalise_url(url)` | Prepends `https://` if no `http://` or `https://` prefix |

Module-level state: `links_list` (array of Quick_Link objects).

---

## Data Models

### Task

```js
{
  id:        string,   // crypto.randomUUID() or Date.now().toString()
  title:     string,   // trimmed, non-empty
  done:      boolean,  // false on creation
  createdAt: number    // Date.now() timestamp — used for creation-order sort
}
```

### Quick_Link

```js
{
  id:    string,  // crypto.randomUUID() or Date.now().toString()
  label: string,  // trimmed, non-empty display text
  url:   string   // normalised — always starts with http:// or https://
}
```

### LocalStorage Key Schema

| Key | Type | Default | Description |
|---|---|---|---|
| `LD_THEME` | `"light" \| "dark"` | `"light"` | Active color theme |
| `LD_TIMER_DURATION` | `number` (1–99) | `25` | Pomodoro session length in minutes |
| `LD_TASKS` | `Task[]` | `[]` | Serialised task array |
| `LD_LINKS` | `Quick_Link[]` | `[]` | Serialised quick-link array |

All keys are prefixed `LD_` to avoid collisions with other apps on the same origin.

---

## HTML Structure

```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Life Dashboard</title>
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <!-- LocalStorage warning banner (hidden by default) -->
  <div id="storage-warning" role="alert" aria-live="polite" hidden>
    ⚠ LocalStorage unavailable — data will not be saved.
  </div>

  <header>
    <h1>Life Dashboard</h1>
    <button id="theme-toggle" aria-label="Toggle dark mode">🌙</button>
  </header>

  <main id="dashboard-grid">

    <!-- Widget 1: Greeting -->
    <section id="greeting-widget" aria-label="Greeting">
      <p id="greeting-text"></p>
      <p id="greeting-time"></p>
      <p id="greeting-date"></p>
    </section>

    <!-- Widget 2: Focus Timer -->
    <section id="timer-widget" aria-label="Focus Timer">
      <h2>Focus Timer</h2>
      <p id="timer-display" aria-live="off">25:00</p>
      <div class="timer-controls">
        <button id="timer-start">Start</button>
        <button id="timer-stop" disabled>Stop</button>
        <button id="timer-reset">Reset</button>
      </div>
      <div class="timer-duration-row">
        <label for="timer-duration-input">Session (min)</label>
        <input id="timer-duration-input" type="number" min="1" max="99" value="25">
      </div>
    </section>

    <!-- Widget 3: To-Do List -->
    <section id="todo-widget" aria-label="To-Do List">
      <h2>To-Do List</h2>
      <div class="todo-add-row">
        <label for="todo-input">New task</label>
        <input id="todo-input" type="text" placeholder="Add a task…">
        <button id="todo-add-btn">Add</button>
      </div>
      <p id="todo-validation" role="alert" aria-live="polite"></p>
      <div class="todo-sort-row" role="group" aria-label="Sort tasks">
        <button data-sort="creation">Creation</button>
        <button data-sort="alpha">A–Z</button>
        <button data-sort="status">Status</button>
      </div>
      <ul id="todo-list" aria-label="Task list"></ul>
    </section>

    <!-- Widget 4: Quick Links -->
    <section id="links-widget" aria-label="Quick Links">
      <h2>Quick Links</h2>
      <div class="links-add-row">
        <label for="links-label-input">Label</label>
        <input id="links-label-input" type="text" placeholder="Label">
        <label for="links-url-input">URL</label>
        <input id="links-url-input" type="url" placeholder="https://…">
        <button id="links-add-btn">Add</button>
      </div>
      <p id="links-validation" role="alert" aria-live="polite"></p>
      <div id="links-container"></div>
    </section>

  </main>

  <script src="js/app.js" defer></script>
</body>
</html>
```

---

## CSS Architecture

### Custom Properties (theming)

```css
:root {
  /* Light theme defaults */
  --color-bg:          #f5f5f5;
  --color-surface:     #ffffff;
  --color-text:        #1a1a1a;
  --color-text-muted:  #555555;
  --color-accent:      #4a6fa5;
  --color-accent-hover:#3a5f95;
  --color-border:      #dddddd;
  --color-danger:      #c0392b;
  --color-warning-bg:  #fff3cd;
  --color-warning-text:#856404;
  --radius:            8px;
  --shadow:            0 2px 6px rgba(0,0,0,.08);
}

[data-theme="dark"] {
  --color-bg:          #1a1a2e;
  --color-surface:     #16213e;
  --color-text:        #e0e0e0;
  --color-text-muted:  #a0a0b0;
  --color-accent:      #7fa8d8;
  --color-accent-hover:#9fbde8;
  --color-border:      #2a2a4a;
  --color-danger:      #e74c3c;
  --color-warning-bg:  #3a3000;
  --color-warning-text:#ffd966;
}
```

All component styles reference only custom properties — swapping the theme requires
only the `data-theme` attribute change on `<html>`.

### Responsive Grid

```css
#dashboard-grid {
  display: grid;
  gap: 1.5rem;
  padding: 1.5rem;
  /* single column on narrow viewports */
  grid-template-columns: 1fr;
}

@media (min-width: 600px) {
  #dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  #dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
    /* Greeting spans full width on large screens */
  }
  #greeting-widget {
    grid-column: 1 / -1;
  }
}
```

### File organisation within `styles.css`

```
1. CSS reset / base
2. Custom properties (:root + [data-theme="dark"])
3. Layout (#dashboard-grid, header, body)
4. Storage warning banner
5. Widget shared styles (.widget-card)
6. Greeting widget
7. Timer widget
8. To-Do widget (list items, edit state, sort buttons)
9. Quick Links widget
10. Utility classes (.sr-only, .validation-msg, .btn-icon)
```

---

## Component Interactions and Event Flow

```
User action                  Handler              Side-effects
─────────────────────────────────────────────────────────────────────
Click #theme-toggle        → theme_toggle()     → data-theme attr, LD_THEME saved
Change #timer-duration-input→ timer_set_duration()→ LD_TIMER_DURATION saved, display reset
Click #timer-start         → timer_start()      → interval started
Click #timer-stop          → timer_stop()       → interval cleared
Click #timer-reset         → timer_reset()      → interval cleared, display reset
Timer interval fires       → timer_tick()       → display updated; at 0 → timer_complete()
timer_complete()           → timer_play_alert() → AudioContext beep
Click #todo-add-btn        → todo_add()         → LD_TASKS saved, list re-rendered
Click [data-sort]          → todo_sort(mode)    → list re-rendered (no save)
Click task checkbox        → todo_toggle(id)    → LD_TASKS saved, list re-rendered
Click task edit button     → todo_edit_start(id)→ inline edit field shown
Confirm task edit          → todo_edit_confirm()→ LD_TASKS saved, list re-rendered
Cancel task edit           → todo_edit_cancel() → list re-rendered (no save)
Click task delete button   → todo_delete(id)    → LD_TASKS saved, list re-rendered
Click #links-add-btn       → links_add()        → LD_LINKS saved, links re-rendered
Click Quick_Link button    → window.open(url, '_blank') → new tab
Click link delete button   → links_delete(id)   → LD_LINKS saved, links re-rendered
```

### Web Audio API — timer alert

```js
function timer_play_alert() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.4, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.6);
  osc.onended = () => ctx.close();
}
```

A new `AudioContext` is created per alert to avoid the "suspended context" issue on
browsers that require a user gesture before audio plays. Because the timer can only
complete after the user has already interacted with the page (pressing Start), the
context will be allowed to play.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

---

### Property 1: Greeting text correctness

*For any* integer hour in [0, 23], `greeting_text(hour)` SHALL return exactly one of
"Good morning" (hours 5–11), "Good afternoon" (hours 12–17), "Good evening" (hours 18–21),
or "Good night" (hours 22–23 and 0–4), with no hour mapping to more than one greeting and
no hour left unmapped.

**Validates: Requirements 1.3, 1.4, 1.5, 1.6**

---

### Property 2: Time display format

*For any* `Date` object, the time-formatting function SHALL return a string matching
`/^\d{2}:\d{2}$/` where the first two digits equal the zero-padded hour and the last two
digits equal the zero-padded minute of that date.

**Validates: Requirements 1.1**

---

### Property 3: Date display format

*For any* `Date` object, the date-formatting function SHALL return a string that contains
the full weekday name, the numeric day of the month, the full month name, and the
four-digit year of that date.

**Validates: Requirements 1.2**

---

### Property 4: Timer display format

*For any* integer `seconds` in [0, 99 × 60], `timer_render(seconds)` SHALL return a
string matching `/^\d{2}:\d{2}$/` where the first two digits equal `Math.floor(seconds /
60)` zero-padded and the last two digits equal `seconds % 60` zero-padded.

**Validates: Requirements 2.1**

---

### Property 5: Timer duration set persists and resets display

*For any* integer `D` in [1, 99], after calling `timer_set_duration(D)`, the value stored
at `LD_TIMER_DURATION` SHALL equal `D` and `timer_remaining` SHALL equal `D × 60`.

**Validates: Requirements 2.5, 2.8**

---

### Property 6: Timer duration validation range

*For any* integer `D`, `timer_set_duration(D)` SHALL accept the value (update state and
storage) if and only if `D` is in [1, 99]; for all other integers it SHALL reject the
value and leave state unchanged.

**Validates: Requirements 2.7**

---

### Property 7: Task add grows list

*For any* task list and any non-empty, non-duplicate title string `T`, after
`todo_add(T)`, the task list length SHALL increase by exactly 1 and `LD_TASKS` SHALL
contain a task whose title equals the trimmed form of `T`.

**Validates: Requirements 3.2**

---

### Property 8: Invalid task input rejected

*For any* string `S` that is either composed entirely of whitespace characters or
case-insensitively matches an existing task title, `todo_add(S)` SHALL leave the task
list length unchanged and SHALL NOT write a new task to `LD_TASKS`.

**Validates: Requirements 3.3, 3.4**

---

### Property 9: Task completion toggle round-trip

*For any* task `T` in the list, toggling `T.done` twice SHALL return `T.done` to its
original value, and each toggle SHALL update `LD_TASKS` with the current state.

**Validates: Requirements 3.5**

---

### Property 10: Task edit with valid title updates and saves

*For any* task `T` and any non-empty string `N` that does not case-insensitively match
any other task's title, after `todo_edit_confirm(T.id, N)`, `T.title` SHALL equal the
trimmed form of `N` and `LD_TASKS` SHALL reflect the updated title.

**Validates: Requirements 3.7**

---

### Property 11: Task edit with invalid title rejected

*For any* task `T` and any string `N` that is empty, whitespace-only, or
case-insensitively matches another existing task's title, `todo_edit_confirm(T.id, N)`
SHALL leave `T.title` unchanged and SHALL NOT update `LD_TASKS`.

**Validates: Requirements 3.8**

---

### Property 12: Task delete removes item

*For any* task `T` present in the list, after `todo_delete(T.id)`, no task with `id`
equal to `T.id` SHALL appear in the in-memory list or in `LD_TASKS`.

**Validates: Requirements 3.9**

---

### Property 13: Task sort invariants

*For any* non-empty task list:
- After `todo_sort("alpha")`, for every adjacent pair `(tasks[i], tasks[i+1])`,
  `tasks[i].title.toLowerCase() <= tasks[i+1].title.toLowerCase()`.
- After `todo_sort("status")`, all tasks where `done === false` appear before all tasks
  where `done === true`.
- After `todo_sort("creation")`, `tasks[i].createdAt <= tasks[i+1].createdAt` for every
  adjacent pair.

**Validates: Requirements 3.10**

---

### Property 14: Task persistence round-trip

*For any* array of `Task` objects written to `LD_TASKS`, after `todo_init()` reads and
renders the list, the rendered task items SHALL correspond one-to-one (by `id` and
`title`) to the saved array.

**Validates: Requirements 3.11**

---

### Property 15: Quick Link add grows list

*For any* non-empty label string and valid URL string, after `links_add(label, url)`, the
links list length SHALL increase by exactly 1 and `LD_LINKS` SHALL contain a Quick_Link
with that label and a normalised form of that URL.

**Validates: Requirements 4.2**

---

### Property 16: Invalid link input rejected

*For any* combination where the label is empty/whitespace or the URL is empty/whitespace,
`links_add()` SHALL leave the links list length unchanged and SHALL NOT write a new entry
to `LD_LINKS`.

**Validates: Requirements 4.3**

---

### Property 17: URL normalisation

*For any* URL string `U` that does not begin with `http://` or `https://`,
`links_normalise_url(U)` SHALL return a string equal to `"https://" + U`.
*For any* URL string `U` that already begins with `http://` or `https://`,
`links_normalise_url(U)` SHALL return `U` unchanged.

**Validates: Requirements 4.4**

---

### Property 18: Quick Link delete removes item

*For any* Quick_Link `L` present in the list, after `links_delete(L.id)`, no link with
`id` equal to `L.id` SHALL appear in the in-memory list or in `LD_LINKS`.

**Validates: Requirements 4.6**

---

### Property 19: Quick Link persistence round-trip

*For any* array of `Quick_Link` objects written to `LD_LINKS`, after `links_init()` reads
and renders the list, the rendered link items SHALL correspond one-to-one (by `id` and
`label`) to the saved array.

**Validates: Requirements 4.7**

---

### Property 20: Theme toggle round-trip and persistence

*For any* starting theme value `V` in `{"light", "dark"}`, after one call to
`theme_toggle()`, `document.documentElement.dataset.theme` SHALL equal the opposite
value and `LD_THEME` SHALL equal that opposite value. After a second call to
`theme_toggle()`, both SHALL return to `V`.

**Validates: Requirements 5.2, 5.3**

---

### Property 21: Input/label association

*For any* `<input>` element in the rendered document that has an `id` attribute, there
SHALL exist exactly one `<label>` element whose `for` attribute equals that `id`.

**Validates: Requirements 7.4**

---

## Error Handling

| Scenario | Detection | Response |
|---|---|---|
| `localStorage` unavailable / throws | `storage_available()` on init | Show `#storage-warning` banner; all `storage_set` calls silently no-op |
| `localStorage` read returns corrupt JSON | `JSON.parse` throws in `storage_get` | Return `null`; caller uses default value |
| `timer_set_duration` receives out-of-range value | Validate in `timer_set_duration` | Ignore; do not update state or storage |
| `todo_add` / `todo_edit_confirm` receives empty or duplicate title | `todo_validate()` returns `{ok: false, error}` | Display error string in `#todo-validation`; clear after next valid action |
| `links_add` receives empty label or URL | Inline check | Display error in `#links-validation` |
| `AudioContext` unavailable (old browser) | `window.AudioContext || window.webkitAudioContext` check | If both undefined, skip alert silently |
| `crypto.randomUUID` unavailable | Feature-detect; fallback to `Date.now().toString() + Math.random()` | Transparent to user |

All error messages are displayed inline near the relevant widget, not as modal dialogs or
`alert()` calls. Validation messages are cleared when the user next successfully completes
the action.

---

## Testing Strategy

### Approach

This feature is a pure client-side JS application with clear input/output functions
(formatters, validators, sort logic, URL normaliser, greeting selector). Property-based
testing is appropriate for these pure functions. Side-effect-heavy operations (DOM
manipulation, `setInterval`, `window.open`, `AudioContext`) are covered by example-based
unit tests with mocks/stubs.

### Property-Based Testing Library

Use **[fast-check](https://github.com/dubzzz/fast-check)** (JavaScript). It runs in any
browser or Node environment without a build step (CDN or local copy). Each property test
is configured to run a minimum of **100 iterations**.

Tag format for each property test:
```
// Feature: todo-life-dashboard, Property N: <property_text>
```

### Property Tests (one test per property)

| Property | Function under test | Generator inputs |
|---|---|---|
| P1 Greeting text | `greeting_text(hour)` | `fc.integer({min:0, max:23})` |
| P2 Time format | time-format function | `fc.date()` |
| P3 Date format | date-format function | `fc.date()` |
| P4 Timer display format | `timer_render(seconds)` | `fc.integer({min:0, max:5940})` |
| P5 Duration set persists | `timer_set_duration(D)` | `fc.integer({min:1, max:99})` |
| P6 Duration validation | `timer_set_duration(D)` | `fc.integer()` |
| P7 Task add grows list | `todo_add(title)` | `fc.string()` filtered non-empty/non-dup |
| P8 Invalid task rejected | `todo_add(S)` | `fc.string()` of whitespace + dup variants |
| P9 Toggle round-trip | `todo_toggle(id)` × 2 | `fc.record({id, title, done, createdAt})` |
| P10 Edit valid | `todo_edit_confirm(id, N)` | valid title strings |
| P11 Edit invalid rejected | `todo_edit_confirm(id, N)` | empty/dup strings |
| P12 Task delete | `todo_delete(id)` | random task arrays |
| P13 Sort invariants | `todo_sort(mode)` | `fc.array(taskRecord)` × 3 modes |
| P14 Task persistence | `storage_set` + `todo_init()` | `fc.array(taskRecord)` |
| P15 Link add grows list | `links_add(label, url)` | valid label+URL pairs |
| P16 Invalid link rejected | `links_add()` | empty/whitespace inputs |
| P17 URL normalisation | `links_normalise_url(U)` | `fc.string()` |
| P18 Link delete | `links_delete(id)` | random link arrays |
| P19 Link persistence | `storage_set` + `links_init()` | `fc.array(linkRecord)` |
| P20 Theme toggle round-trip | `theme_toggle()` × 2 | `fc.constantFrom("light","dark")` |
| P21 Input/label association | DOM query | static — run once on loaded document |

### Example-Based Unit Tests

Cover scenarios not suited to PBT:

- Timer start/stop/tick with fake `setInterval` (Requirements 2.3, 2.4)
- Timer completion triggers alert mock (Requirement 2.6)
- Timer init reads from storage / defaults to 25 (Requirement 2.9)
- Theme init reads from storage / defaults to light (Requirement 5.4)
- `storage_init()` with mocked unavailable `localStorage` shows banner (Requirement 6.2)
- `window.open` called with correct args on Quick_Link click (Requirement 4.5)
- Edit mode shows pre-filled input field (Requirement 3.6)

### Smoke / Structural Tests

Run once on the loaded document:

- All four widget sections present in DOM (Requirements 1–4)
- Theme toggle button present (Requirement 5.1)
- Timer Start/Stop/Reset buttons present (Requirement 2.2)
- Todo input + Add button present (Requirement 3.1)
- Links label input, URL input, Add button present (Requirement 4.1)
- All four `LD_*` keys are distinct strings (Requirement 6.1)
- No `fetch` / `XMLHttpRequest` calls in source (Requirement 6.3)

### Accessibility

- Manual contrast check with browser DevTools or axe-core for both themes (Requirement 7.5)
- Responsive layout verified at 375 px and 1024 px viewports (Requirements 7.1, 7.2)
- Semantic element presence verified by DOM queries (Requirement 7.3)
