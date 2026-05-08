# Implementation Plan: To-Do Life Dashboard

## Overview

Build a zero-dependency, single-page productivity dashboard as three static files
(`index.html`, `css/styles.css`, `js/app.js`). Implementation proceeds in layers:
scaffold → HTML → CSS → JS modules (storage → theme → greeting → timer → todo → links)
→ wiring → accessibility pass.

## Tasks

- [x] 1. Scaffold project structure
  - Create `index.html`, `css/styles.css`, `js/app.js` at the repo root
  - Verify the three files exist and are linked correctly (stylesheet `<link>`, deferred `<script>`)
  - _Requirements: 6.3, 7.3_

- [x] 2. Write full HTML document
  - [x] 2.1 Add document shell and `<head>`
    - `<!DOCTYPE html>`, `lang="en"`, `data-theme="light"`, charset, viewport meta, title
    - Link `css/styles.css`; defer `js/app.js`
    - _Requirements: 7.3_
  - [x] 2.2 Add `<header>` and storage-warning banner
    - `<h1>Life Dashboard</h1>`, `#theme-toggle` button with `aria-label`
    - `#storage-warning` div with `role="alert"` and `aria-live="polite"`, `hidden` by default
    - _Requirements: 5.1, 6.2_
  - [x] 2.3 Add Greeting widget markup
    - `<section id="greeting-widget" aria-label="Greeting">` with `#greeting-text`, `#greeting-time`, `#greeting-date` paragraphs
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 2.4 Add Timer widget markup
    - `<section id="timer-widget">` with `#timer-display` (`aria-live="off"`), Start/Stop/Reset buttons, duration `<input>` with `<label>`
    - _Requirements: 2.1, 2.2, 7.4_
  - [x] 2.5 Add To-Do widget markup
    - `<section id="todo-widget">` with `#todo-input` + `<label>`, `#todo-add-btn`, `#todo-validation` (`role="alert"`), sort buttons (`data-sort`), `<ul id="todo-list">`
    - _Requirements: 3.1, 7.3, 7.4_
  - [x] 2.6 Add Quick Links widget markup
    - `<section id="links-widget">` with `#links-label-input`, `#links-url-input` (both with `<label>`), `#links-add-btn`, `#links-validation` (`role="alert"`), `#links-container`
    - _Requirements: 4.1, 7.3, 7.4_

- [x] 3. Write CSS — base, theming, layout
  - [x] 3.1 CSS reset and base styles
    - Box-sizing reset, margin/padding zero, `font-family`, `body` background and color via custom properties
    - _Requirements: 7.1, 7.2_
  - [x] 3.2 CSS custom properties for light and dark themes
    - Define all `--color-*`, `--radius`, `--shadow` variables under `:root`
    - Override all variables under `[data-theme="dark"]`
    - _Requirements: 5.2, 7.5_
  - [x] 3.3 Responsive grid layout
    - `#dashboard-grid`: `display:grid`, single column default
    - `@media (min-width:600px)`: two-column grid
    - `@media (min-width:1024px)`: `#greeting-widget { grid-column: 1 / -1 }`
    - _Requirements: 7.1, 7.2_
  - [x] 3.4 Header, storage-warning banner, and widget card styles
    - `<header>` flex layout; `#storage-warning` warning colors; `.widget-card` surface/shadow/radius
    - _Requirements: 6.2_
  - [x] 3.5 Widget-specific styles
    - Greeting: large time text, muted date
    - Timer: large `#timer-display`, button group, duration row
    - To-Do: list item layout, checkbox, edit/delete icon buttons, sort button group, validation message
    - Quick Links: link button grid, delete icon, validation message
    - Utility classes: `.sr-only`, `.validation-msg`, `.btn-icon`
    - _Requirements: 7.3, 7.5_

- [-] 4. Implement storage module
  - [ ] 4.1 Write `storage_available()`, `storage_get()`, `storage_set()`
    - Wrap all `localStorage` calls in try/catch
    - `storage_available()` sets a module-level flag; on failure reveals `#storage-warning`
    - `storage_get` returns `null` on miss or JSON parse error
    - `storage_set` returns `false` on error; no-ops when unavailable flag is set
    - _Requirements: 6.1, 6.2_
  - [ ] 4.2 Write unit tests for storage module
    - Test `storage_get` with corrupt JSON returns `null`
    - Test `storage_set` returns `false` when localStorage throws
    - Test `storage_available()` shows banner when localStorage unavailable
    - _Requirements: 6.2_

- [ ] 5. Implement theme module
  - [ ] 5.1 Write `theme_init()` and `theme_toggle()`
    - `theme_init`: read `LD_THEME`; apply `data-theme` on `<html>`; default `"light"`
    - `theme_toggle`: flip `data-theme`; save to `LD_THEME`; update toggle button icon
    - Wire `#theme-toggle` click → `theme_toggle()`
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [ ] 5.2 Write property test for theme toggle round-trip (Property 20)
    - **Property 20: Theme toggle round-trip and persistence**
    - **Validates: Requirements 5.2, 5.3**
  - [ ] 5.3 Write unit test for theme init
    - Test reads from storage and defaults to `"light"` when key absent
    - _Requirements: 5.4_

- [ ] 6. Implement greeting module
  - [ ] 6.1 Write `greeting_text(hour)`, time-format function, date-format function
    - `greeting_text`: pure function mapping hour → greeting string (5–11 morning, 12–17 afternoon, 18–21 evening, 22–4 night)
    - Time-format: returns zero-padded `HH:MM` string from a `Date`
    - Date-format: returns human-readable string (e.g., "Monday, 14 July 2025") from a `Date`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
  - [ ] 6.2 Write `greeting_render()` and `greeting_init()`
    - `greeting_render`: reads `new Date()`, updates `#greeting-text`, `#greeting-time`, `#greeting-date`
    - `greeting_init`: calls `greeting_render()`; starts `setInterval(greeting_render, 60000)`
    - _Requirements: 1.1, 1.2_
  - [ ] 6.3 Write property test for greeting text correctness (Property 1)
    - **Property 1: Greeting text correctness**
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6**
  - [ ] 6.4 Write property test for time display format (Property 2)
    - **Property 2: Time display format**
    - **Validates: Requirements 1.1**
  - [ ] 6.5 Write property test for date display format (Property 3)
    - **Property 3: Date display format**
    - **Validates: Requirements 1.2**

- [ ] 7. Implement timer module
  - [ ] 7.1 Write `timer_render()` and `timer_set_duration()`
    - `timer_render`: formats `timer_remaining` as `MM:SS`; updates `#timer-display`
    - `timer_set_duration`: validates 1–99; saves `LD_TIMER_DURATION`; calls `timer_reset()`
    - _Requirements: 2.1, 2.5, 2.7, 2.8_
  - [ ] 7.2 Write `timer_init()`, `timer_start()`, `timer_stop()`, `timer_reset()`, `timer_tick()`
    - `timer_init`: reads `LD_TIMER_DURATION`; defaults to 25; sets `timer_remaining`; calls `timer_render()`
    - `timer_start`: starts 1 s interval; disables Start, enables Stop
    - `timer_stop`: clears interval; enables Start, disables Stop
    - `timer_reset`: calls `timer_stop()`; restores `timer_remaining` to `timer_duration × 60`; calls `timer_render()`
    - `timer_tick`: decrements `timer_remaining`; calls `timer_render()`; at 0 calls `timer_complete()`
    - Wire Start/Stop/Reset buttons and duration input change event
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.9_
  - [ ] 7.3 Write `timer_complete()` and `timer_play_alert()`
    - `timer_complete`: calls `timer_stop()`; calls `timer_play_alert()`
    - `timer_play_alert`: creates `AudioContext`; plays 880 Hz sine wave for 0.6 s; feature-detects `AudioContext`
    - _Requirements: 2.6_
  - [ ] 7.4 Write property test for timer display format (Property 4)
    - **Property 4: Timer display format**
    - **Validates: Requirements 2.1**
  - [ ] 7.5 Write property test for timer duration set persists and resets display (Property 5)
    - **Property 5: Timer duration set persists and resets display**
    - **Validates: Requirements 2.5, 2.8**
  - [ ] 7.6 Write property test for timer duration validation range (Property 6)
    - **Property 6: Timer duration validation range**
    - **Validates: Requirements 2.7**
  - [ ] 7.7 Write unit tests for timer start/stop/tick/complete
    - Test start/stop with fake `setInterval`; test tick decrements; test complete triggers alert mock
    - _Requirements: 2.3, 2.4, 2.6_

- [ ] 8. Checkpoint — storage, theme, greeting, timer complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement to-do module
  - [ ] 9.1 Write `todo_validate()` and `todo_save()`
    - `todo_validate(title, excludeId)`: returns `{ok, error}` — checks empty/whitespace and case-insensitive duplicate
    - `todo_save()`: calls `storage_set(LD_TASKS, todo_tasks)`
    - _Requirements: 3.3, 3.4, 3.8_
  - [ ] 9.2 Write `todo_render_item()` and `todo_render_all()`
    - `todo_render_item(task)`: returns `<li>` with checkbox, title span, edit button, delete button; marks done items
    - `todo_render_all()`: clears `#todo-list`; appends rendered item for each task in `todo_tasks`
    - _Requirements: 3.1, 3.5, 3.6_
  - [ ] 9.3 Write `todo_init()`, `todo_add()`, `todo_delete()`, `todo_toggle()`
    - `todo_init`: reads `LD_TASKS`; defaults to `[]`; calls `todo_render_all()`
    - `todo_add`: reads `#todo-input`; calls `todo_validate()`; on fail shows `#todo-validation`; on pass creates Task (with `crypto.randomUUID` fallback), pushes, saves, re-renders
    - `todo_delete(id)`: filters out task; saves; re-renders
    - `todo_toggle(id)`: flips `done`; saves; re-renders
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.9, 3.11_
  - [ ] 9.4 Write `todo_edit_start()`, `todo_edit_confirm()`, `todo_edit_cancel()`
    - `todo_edit_start(id)`: replaces title span with pre-filled `<input>`; shows confirm/cancel controls
    - `todo_edit_confirm(id)`: calls `todo_validate(newTitle, id)`; on fail shows error; on pass updates title, saves, re-renders
    - `todo_edit_cancel(id)`: re-renders without saving
    - _Requirements: 3.6, 3.7, 3.8_
  - [ ] 9.5 Write `todo_sort()` and wire sort buttons
    - `todo_sort(mode)`: sorts `todo_tasks` in-memory by `"creation"`, `"alpha"`, or `"status"`; calls `todo_render_all()` (no save)
    - Wire `[data-sort]` button clicks → `todo_sort(mode)`
    - _Requirements: 3.10_
  - [ ] 9.6 Write property test for task add grows list (Property 7)
    - **Property 7: Task add grows list**
    - **Validates: Requirements 3.2**
  - [ ] 9.7 Write property test for invalid task input rejected (Property 8)
    - **Property 8: Invalid task input rejected**
    - **Validates: Requirements 3.3, 3.4**
  - [ ] 9.8 Write property test for task completion toggle round-trip (Property 9)
    - **Property 9: Task completion toggle round-trip**
    - **Validates: Requirements 3.5**
  - [ ] 9.9 Write property test for task edit with valid title (Property 10)
    - **Property 10: Task edit with valid title updates and saves**
    - **Validates: Requirements 3.7**
  - [ ] 9.10 Write property test for task edit with invalid title rejected (Property 11)
    - **Property 11: Task edit with invalid title rejected**
    - **Validates: Requirements 3.8**
  - [ ] 9.11 Write property test for task delete removes item (Property 12)
    - **Property 12: Task delete removes item**
    - **Validates: Requirements 3.9**
  - [ ] 9.12 Write property test for task sort invariants (Property 13)
    - **Property 13: Task sort invariants** (all three modes)
    - **Validates: Requirements 3.10**
  - [ ] 9.13 Write property test for task persistence round-trip (Property 14)
    - **Property 14: Task persistence round-trip**
    - **Validates: Requirements 3.11**
  - [ ] 9.14 Write unit tests for to-do edit mode
    - Test edit mode shows pre-filled input; test cancel restores without saving
    - _Requirements: 3.6_

- [ ] 10. Implement links module
  - [ ] 10.1 Write `links_normalise_url()`, `links_save()`
    - `links_normalise_url(url)`: prepends `https://` if no `http://` or `https://` prefix
    - `links_save()`: calls `storage_set(LD_LINKS, links_list)`
    - _Requirements: 4.4_
  - [ ] 10.2 Write `links_render_item()` and `links_render_all()`
    - `links_render_item(link)`: returns DOM node with clickable button (`window.open(url, '_blank')`) and delete icon
    - `links_render_all()`: clears `#links-container`; appends rendered item for each link
    - _Requirements: 4.5_
  - [ ] 10.3 Write `links_init()`, `links_add()`, `links_delete()`
    - `links_init`: reads `LD_LINKS`; defaults to `[]`; calls `links_render_all()`
    - `links_add`: reads label + URL inputs; validates non-empty; normalises URL; creates Quick_Link (with `crypto.randomUUID` fallback); saves; re-renders
    - `links_delete(id)`: filters out link; saves; re-renders
    - Wire `#links-add-btn` click → `links_add()`
    - _Requirements: 4.1, 4.2, 4.3, 4.6, 4.7_
  - [ ] 10.4 Write property test for Quick Link add grows list (Property 15)
    - **Property 15: Quick Link add grows list**
    - **Validates: Requirements 4.2**
  - [ ] 10.5 Write property test for invalid link input rejected (Property 16)
    - **Property 16: Invalid link input rejected**
    - **Validates: Requirements 4.3**
  - [ ] 10.6 Write property test for URL normalisation (Property 17)
    - **Property 17: URL normalisation**
    - **Validates: Requirements 4.4**
  - [ ] 10.7 Write property test for Quick Link delete removes item (Property 18)
    - **Property 18: Quick Link delete removes item**
    - **Validates: Requirements 4.6**
  - [ ] 10.8 Write property test for Quick Link persistence round-trip (Property 19)
    - **Property 19: Quick Link persistence round-trip**
    - **Validates: Requirements 4.7**
  - [ ] 10.9 Write unit test for Quick Link opens new tab
    - Mock `window.open`; verify called with correct URL and `'_blank'`
    - _Requirements: 4.5_

- [ ] 11. Wire DOMContentLoaded init sequence
  - Add `document.addEventListener('DOMContentLoaded', ...)` in `app.js`
  - Call in order: `storage.init()` → `theme.init()` → `greeting.init()` → `timer.init()` → `todo.init()` → `links.init()`
  - _Requirements: 6.1_

- [ ] 12. Checkpoint — all modules wired, full app functional
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Accessibility and validation pass
  - [ ] 13.1 Write property test for input/label association (Property 21)
    - **Property 21: Input/label association**
    - **Validates: Requirements 7.4**
  - [ ] 13.2 Verify semantic structure and ARIA attributes
    - Confirm `<main>`, `<section>`, `<header>`, `<button>`, `<input>`, `<label>` used correctly
    - Confirm `role="alert"` and `aria-live` on validation paragraphs and storage banner
    - Confirm `aria-label` on widget sections and theme toggle button
    - _Requirements: 7.3, 7.4_
  - [ ] 13.3 Write smoke tests for structural correctness
    - All four widget sections present in DOM
    - Theme toggle, timer controls, todo input, links inputs all present
    - All four `LD_*` keys are distinct strings
    - _Requirements: 6.1, 7.3_

- [ ] 14. Final checkpoint — all tests pass, dashboard complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use **fast-check** (CDN or local copy); tag format: `// Feature: todo-life-dashboard, Property N: <text>`
- Each property test runs a minimum of 100 iterations
- No build step required — tests can run directly in browser or Node with a `<script>` tag loading fast-check
- All 21 correctness properties from the design are covered by optional sub-tasks
- Checkpoints at tasks 8, 12, and 14 ensure incremental validation
