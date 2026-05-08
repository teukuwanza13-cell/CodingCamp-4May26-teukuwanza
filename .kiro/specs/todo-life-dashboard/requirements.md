# Requirements Document

## Introduction

A single-page, client-side "Life Dashboard" web app built with HTML, CSS, and Vanilla JS. All data persists in browser LocalStorage. The dashboard combines four productivity widgets — Greeting, Focus Timer, To-Do List, and Quick Links — with light/dark mode and no backend or build tooling required.

## Glossary

- **Dashboard**: The single HTML page that hosts all widgets.
- **Greeting_Widget**: The section displaying the current time, date, and a time-of-day greeting.
- **Timer_Widget**: The Pomodoro-style countdown timer section.
- **Todo_Widget**: The task management section.
- **Links_Widget**: The quick-access bookmarks section.
- **Task**: A user-created to-do item with a title and a completion state.
- **Session_Duration**: The configurable countdown length for the Timer_Widget (default 25 minutes).
- **Quick_Link**: A user-saved label/URL pair rendered as a clickable button.
- **LocalStorage**: The browser's `window.localStorage` API used for all persistence.
- **Theme**: The active color scheme — either `light` or `dark`.

---

## Requirements

### Requirement 1: Greeting Widget

**User Story:** As a user, I want to see the current time, date, and a contextual greeting, so that I have an at-a-glance sense of the moment when I open the dashboard.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current time in HH:MM format, updated every 60 seconds.
2. THE Greeting_Widget SHALL display the current date in a human-readable format (e.g., "Monday, 14 July 2025").
3. WHEN the local hour is between 05:00 and 11:59, THE Greeting_Widget SHALL display the greeting "Good morning".
4. WHEN the local hour is between 12:00 and 17:59, THE Greeting_Widget SHALL display the greeting "Good afternoon".
5. WHEN the local hour is between 18:00 and 21:59, THE Greeting_Widget SHALL display the greeting "Good evening".
6. WHEN the local hour is between 22:00 and 04:59, THE Greeting_Widget SHALL display the greeting "Good night".

---

### Requirement 2: Focus Timer

**User Story:** As a user, I want a configurable Pomodoro countdown timer with start, stop, and reset controls, so that I can manage focused work sessions.

#### Acceptance Criteria

1. THE Timer_Widget SHALL display a countdown in MM:SS format initialised to the current Session_Duration.
2. THE Timer_Widget SHALL provide a Start button, a Stop button, and a Reset button.
3. WHEN the Start button is activated, THE Timer_Widget SHALL begin counting down one second per second.
4. WHEN the Stop button is activated while the timer is running, THE Timer_Widget SHALL pause the countdown at the current remaining time.
5. WHEN the Reset button is activated, THE Timer_Widget SHALL stop the countdown and restore the display to the current Session_Duration.
6. WHEN the countdown reaches 00:00, THE Timer_Widget SHALL stop automatically and play an audible alert using the Web Audio API.
7. THE Timer_Widget SHALL provide a numeric input field allowing the user to set Session_Duration to any integer value between 1 and 99 minutes.
8. WHEN the user changes Session_Duration, THE Timer_Widget SHALL save the new value to LocalStorage and reset the display to the updated Session_Duration.
9. WHEN the Dashboard loads, THE Timer_Widget SHALL read Session_Duration from LocalStorage and initialise the display accordingly; IF no stored value exists, THE Timer_Widget SHALL default to 25 minutes.

---

### Requirement 3: To-Do List

**User Story:** As a user, I want to add, edit, complete, sort, and delete tasks that persist across sessions, so that I can track my work without losing data on page refresh.

#### Acceptance Criteria

1. THE Todo_Widget SHALL provide a text input and an Add button for creating new Tasks.
2. WHEN the Add button is activated with a non-empty, non-duplicate task title, THE Todo_Widget SHALL append the new Task to the list and save the updated list to LocalStorage.
3. IF the Add button is activated with an empty task title, THEN THE Todo_Widget SHALL display an inline validation message and SHALL NOT create a Task.
4. IF the Add button is activated with a task title that matches an existing Task title (case-insensitive), THEN THE Todo_Widget SHALL display an inline duplicate-warning message and SHALL NOT create a Task.
5. WHEN a Task's completion checkbox is toggled, THE Todo_Widget SHALL update the Task's completion state and save the updated list to LocalStorage.
6. WHEN a Task's Edit control is activated, THE Todo_Widget SHALL replace the Task title with an editable text field pre-filled with the current title.
7. WHEN the user confirms an edit with a non-empty, non-duplicate title, THE Todo_Widget SHALL update the Task title and save the updated list to LocalStorage.
8. IF the user confirms an edit with an empty title or a title matching another existing Task (case-insensitive), THEN THE Todo_Widget SHALL display an inline validation message and SHALL NOT update the Task.
9. WHEN a Task's Delete control is activated, THE Todo_Widget SHALL remove the Task from the list and save the updated list to LocalStorage.
10. THE Todo_Widget SHALL provide sort controls allowing the user to order Tasks by: (a) creation order, (b) alphabetical order, or (c) completion status (incomplete first).
11. WHEN the Dashboard loads, THE Todo_Widget SHALL read the Task list from LocalStorage and render all saved Tasks.

---

### Requirement 4: Quick Links

**User Story:** As a user, I want to save and manage labeled URL shortcuts that open in a new tab, so that I can reach my most-used sites from the dashboard.

#### Acceptance Criteria

1. THE Links_Widget SHALL provide a label input, a URL input, and an Add button for creating new Quick_Links.
2. WHEN the Add button is activated with a non-empty label and a valid URL, THE Links_Widget SHALL add the Quick_Link and save the updated list to LocalStorage.
3. IF the Add button is activated with an empty label or an empty URL, THEN THE Links_Widget SHALL display an inline validation message and SHALL NOT create a Quick_Link.
4. IF the Add button is activated with a URL that does not begin with `http://` or `https://`, THEN THE Links_Widget SHALL prepend `https://` to the URL before saving.
5. WHEN a Quick_Link button is clicked, THE Links_Widget SHALL open the associated URL in a new browser tab.
6. WHEN a Quick_Link's Delete control is activated, THE Links_Widget SHALL remove the Quick_Link and save the updated list to LocalStorage.
7. WHEN the Dashboard loads, THE Links_Widget SHALL read the Quick_Link list from LocalStorage and render all saved Quick_Links.

---

### Requirement 5: Light/Dark Mode

**User Story:** As a user, I want to toggle between light and dark color schemes, so that I can use the dashboard comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a toggle control for switching between the `light` Theme and the `dark` Theme.
2. WHEN the toggle is activated, THE Dashboard SHALL apply the selected Theme to all visible elements immediately without a page reload.
3. WHEN the user sets a Theme, THE Dashboard SHALL save the selected Theme value to LocalStorage.
4. WHEN the Dashboard loads, THE Dashboard SHALL read the Theme from LocalStorage and apply it; IF no stored Theme exists, THE Dashboard SHALL apply the `light` Theme by default.

---

### Requirement 6: Data Persistence

**User Story:** As a user, I want all my settings and data to survive page refreshes and browser restarts, so that I never have to re-enter information.

#### Acceptance Criteria

1. THE Dashboard SHALL store all mutable state — Task list, Quick_Link list, Session_Duration, and Theme — exclusively in LocalStorage using distinct, namespaced keys.
2. WHEN LocalStorage is unavailable or throws an exception, THE Dashboard SHALL display a non-blocking warning banner informing the user that data will not be saved.
3. THE Dashboard SHALL NOT make any network requests for data storage or retrieval.

---

### Requirement 7: Responsive Layout and Accessibility

**User Story:** As a user, I want the dashboard to be readable and usable on both desktop and mobile screen sizes, so that I can access it from any device.

#### Acceptance Criteria

1. THE Dashboard SHALL render all four widgets in a single-column layout on viewports narrower than 600px.
2. THE Dashboard SHALL render widgets in a multi-column grid layout on viewports 600px wide or wider.
3. THE Dashboard SHALL use semantic HTML elements (`<main>`, `<section>`, `<button>`, `<input>`, `<label>`) for all interactive and structural content.
4. THE Dashboard SHALL associate every `<input>` element with a visible `<label>` element via matching `for` and `id` attributes.
5. THE Dashboard SHALL maintain a color contrast ratio of at least 4.5:1 between text and background colors in both the `light` and `dark` Themes.
