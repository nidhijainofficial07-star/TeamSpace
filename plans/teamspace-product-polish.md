# TeamSpace Product Polish Plan

## Objective

Turn the current polished-but-mostly-ephemeral TeamSpace prototype into a convincing frontend product demo. Preserve the existing visual language and frontend-only constraint while making navigation, CRUD interactions, search, persistence, dates, notifications, and accessibility behave coherently.

## Success Criteria

- Every major screen has a stable, shareable URL and browser back/forward navigation works.
- Refreshing the app preserves mock sign-in state and user-created/edited projects, tasks, comments, notifications, files, and preferences.
- Global search finds projects, tasks, and people and takes the user to the selected result.
- Project and task creation/editing use the entered form values rather than placeholder defaults.
- Previously cosmetic controls covered by this plan provide visible, persistent mock behavior.
- Dates and dashboard calculations are derived from data rather than hard-coded display values.
- Dialogs, navigation, search, tabs, switches, toasts, and clickable cards are keyboard-usable and have appropriate accessible semantics.
- The app remains responsive and frontend-only; no API, authentication provider, database, or Supabase integration is introduced.
- TypeScript and the production build pass.

## Current-State Findings

- Navigation is a single `View` state in `src/App.tsx`; URLs, deep links, refresh restoration, and browser history do not work.
- Tasks are held in top-level React state, while projects, comments, files, notifications, and settings are mostly static or component-local.
- The create-project dialog closes with a toast but does not add a project.
- The task modal only captures its title; all other submitted values are hard-coded.
- Comments, discussions, settings, and notification filters reset when their component unmounts.
- Header search is visual only.
- Several buttons such as mark-all-read, upload, download, and forgot password are cosmetic.
- Dashboard deadlines, greeting date, calendar month, task detail project label, and much mock data are hard-coded to 2025.
- Modal behavior lacks Escape handling, focus trapping/restoration, dialog semantics, and an accessible title relationship.
- Several clickable cards are non-semantic `div` elements, and switches/tabs lack complete ARIA state.
- `react-router` and an accessible dialog primitive are not currently installed.

## Implementation Plan

### 1. Establish URL-backed application routing

- Install `react-router` and use its Data Router pattern as required by the project routing procedure.
- Reorganize the entry layer so `src/app/App.tsx` renders `RouterProvider` and `src/app/routes.tsx` owns route configuration.
- Keep `src/main.tsx` as the DOM mount and point it to the new app entry.
- Define these routes:
  - `/login`
  - `/dashboard`
  - `/projects`
  - `/projects/:projectId`
  - `/tasks`
  - `/tasks/:taskId`
  - `/calendar`
  - `/notifications`
  - `/settings`
  - catch-all not-found route
- Use a protected workspace layout route for the sidebar/header shell. Since authentication is mocked, the guard reads local mock session state and redirects between `/login` and `/dashboard` only.
- Replace `View`-based navigation callbacks with router `Link`, `NavLink`, `navigate`, and route params.
- Preserve project-tab state in a `tab` search parameter such as `/projects/p1?tab=files`, making a selected project section refresh-safe.
- Ensure task “Back” behavior prefers browser history and falls back to `/tasks` when opened directly.
- Add route-level not-found and missing-entity states with clear actions back to Projects or Tasks.

### 2. Introduce a frontend repository/store boundary

- Add a versioned workspace state model containing:
  - projects
  - tasks, including comments and attachments
  - discussion messages by project
  - files
  - notifications
  - user preferences and workspace settings
  - mock session state
- Move seed content into an immutable `seedWorkspace` in the data layer. Keep members as reference data unless future interactions require editing them.
- Add a `WorkspaceProvider` backed by `useReducer`, plus narrowly scoped hooks/selectors for reading and mutating data.
- Expose explicit actions instead of allowing pages to mutate arrays directly:
  - `createProject`, `updateProject`
  - `createTask`, `updateTask`, `setTaskStatus`
  - `addTaskComment`
  - `addDiscussionMessage`
  - `uploadMockFile`
  - `markNotificationRead`, `markAllNotificationsRead`
  - `updatePreferences`, `updateProfile`, `updateWorkspace`
  - `resetDemoData`
- Persist reducer state to `localStorage` under a versioned key. Validate the stored shape/version before hydration; fall back to seed data if parsing or migration fails.
- Keep persistence details behind a repository adapter (`load`, `save`, `clear`) so Supabase can later replace storage without page rewrites.
- Generate stable local IDs using `crypto.randomUUID()` with a deterministic fallback if unavailable.
- Derive project task counts and completion percentages from tasks instead of storing stale duplicate values. Update the `Project` model accordingly or expose a project-summary selector.

### 3. Make CRUD and existing controls genuinely functional

#### Projects

- Convert the create-project dialog to a controlled form with name, description, deadline, initial members, and color/accent selection.
- Validate required fields, prevent invalid past deadlines, disable submission while invalid, and surface inline field messages.
- On success, persist the project, show an accessible toast, and navigate to its details route.
- Add a lightweight project edit action from the project detail overflow menu; do not add deletion in this pass to avoid accidental destructive demo behavior.

#### Tasks

- Make every TaskModal field controlled and submitted: title, description, status, priority, assignee, project, deadline, and tags.
- When launched inside a project, preselect that project; from global My Tasks, allow project selection.
- Validate title, project, assignee, and deadline. Editing must preserve comments and attachments.
- Add a quick status control on task details and a completion toggle in assigned-task rows, both using the same store action.
- Ensure list/board filters are reflected in URL search parameters so they survive refresh and browser navigation.
- Show a purposeful empty state when filters produce no tasks, with a clear-filters action.
- Keep the conflict banner as a simulation but make each resolution option produce distinct feedback and dismiss the banner for the current task.

#### Comments, discussion, files, notifications, and settings

- Route new task comments through the workspace store so they persist and update comment counts everywhere.
- Persist project discussion messages and show their sender/timestamp consistently.
- Implement mock file upload using a hidden file input: capture file name, inferred type, size, uploader, and current timestamp; do not transmit file contents.
- Make download buttons provide a clear “Demo file download simulated” toast rather than silently doing nothing.
- Make notification rows mark themselves read when activated; “Mark all as read” updates both the page and sidebar/header badge.
- Persist profile, notification, appearance, and workspace setting forms. Appearance theme remains a mock preference unless applying it can be done consistently across every screen; this pass will visually select and persist the option but keep the current light theme as the rendered theme.
- Implement forgot-password and Google-login mock actions with clear explanatory feedback, avoiding any implication that real authentication occurred.

### 4. Add a useful global search / command palette

- Replace the inert desktop search with a global search trigger that opens a command-style overlay; support `Cmd/Ctrl + K` and a mobile search action.
- Search project names/descriptions, task titles/descriptions/tags, and member names/roles with case-insensitive token matching.
- Group results by Projects, Tasks, and People, cap each group to a useful number, and display type-specific metadata.
- Selecting a project or task navigates directly to its route. Selecting a person navigates to My Tasks with a member filter in the URL.
- Provide recent destinations while the query is empty and a polished no-results state otherwise.
- Support arrow-key navigation, Enter selection, Escape close, and visible active-result treatment.
- Keep search entirely local and derived from the workspace state/reference data.

### 5. Make dates and derived dashboard data coherent

- Add shared date utilities for ISO parsing, display formatting, relative labels, overdue checks, and month-grid generation.
- Replace hard-coded dashboard date/greeting with the current local date and time-appropriate greeting.
- Derive dashboard totals, upcoming deadlines, overdue count, completed count, and overall progress from store data.
- Sort upcoming deadlines chronologically and exclude completed tasks from overdue/upcoming calculations where appropriate.
- Update seed dates at load time relative to a stable “today” anchor so the demo always contains a believable mix of overdue, due-soon, and future work without rewriting persisted user data.
- Replace the fixed June 2025 calendar with a real month grid driven by selected year/month and task deadlines.
- On narrow screens, use a compact agenda beneath the month header or horizontally scroll the calendar safely; do not squeeze unreadable seven-column cells.
- Derive task-detail project labels from `task.projectId` rather than always showing Orbit Mobile App.

### 6. Accessibility and interaction hardening

- Install and use `@radix-ui/react-dialog` for the shared modal/dialog primitive so focus trapping, Escape close, focus restoration, accessible title/description, and background inertness are handled correctly.
- Upgrade shared primitives:
  - labels accept `htmlFor`; controls receive stable IDs and `aria-describedby` for errors
  - switches expose `role="switch"`, `aria-checked`, and an accessible label
  - tabs expose tablist/tab semantics, selected state, and keyboard navigation
  - progress exposes `role="progressbar"` and numeric value attributes
  - toast region uses `aria-live="polite"` and supports queued/deduplicated messages
- Convert clickable project/task cards to semantic links or buttons with visible focus states.
- Give icon-only buttons descriptive accessible names.
- Make sidebar mobile overlay and menu keyboard-safe, close on Escape, and restore focus to the menu trigger.
- Ensure text/background combinations, focus rings, and status communication do not rely on color alone.
- Respect `prefers-reduced-motion` for existing transforms/transitions.

### 7. Component and file organization

- Split the oversized `src/pages/Pages.tsx` into route-focused modules under `src/pages/`:
  - `LoginPage.tsx`
  - `DashboardPage.tsx`
  - `ProjectsPage.tsx`
  - `ProjectPage.tsx`
  - `TasksPage.tsx`
  - `TaskPage.tsx`
  - `CalendarPage.tsx`
  - `NotificationsPage.tsx`
  - `SettingsPage.tsx`
  - `NotFoundPage.tsx`
- Split reusable overlays/forms from `product.tsx` into focused components such as `TaskFormDialog`, `ProjectFormDialog`, `GlobalSearch`, `ToastProvider`, and `FileUploader`.
- Keep visual primitives in `components/ui`, domain components in `components/teamspace`, route components in `pages`, router/store wiring in `app`, and mock persistence/data in `data` or `services`.
- Avoid a broad styling rewrite; preserve current Tailwind tokens, spacing, typography, and indigo/slate visual language.

## Data and Interface Decisions

- No backend calls will exist. All asynchronous-looking feedback remains explicitly simulated.
- The workspace reducer is the single source of truth after seed hydration.
- Derived values such as project progress and task counts will not be independently persisted.
- Routes use entity IDs, not names/slugs, to avoid rename instability.
- Route search parameters own page-level view/filter state; local component state owns transient form input and open/closed state.
- Stored dates remain ISO `YYYY-MM-DD` values; formatting is centralized at render time.
- File metadata is stored, but browser file blobs are not persisted.
- Persisted state uses a schema version to allow safe reset/migration later.
- The existing conflict warning remains opt-in demo UI rather than pretending to detect real concurrent changes.

## Edge Cases and Failure Handling

- Invalid or stale project/task IDs render a scoped not-found state rather than silently selecting the first entity.
- Corrupt or incompatible localStorage data is discarded safely and replaced with seed data.
- Empty projects, empty task columns, empty search results, and empty notification states use the existing EmptyState pattern.
- Forms trim input and reject whitespace-only required fields.
- A task cannot reference a missing project or member; hydrated data with broken references is filtered or repaired to defaults.
- Calendar date math avoids locale string parsing by operating on ISO parts/local dates explicitly.
- Multiple rapid toasts are queued or replaced predictably rather than racing independent timers.
- Login redirect preserves the originally requested workspace route when practical.
- The app handles direct route loads under Vite’s history fallback and includes a catch-all client route.

## Verification Strategy

1. Run formatting through the repository’s configured `pnpm format` entry point on changed source files or the project as supported by that script.
2. Run `pnpm exec tsc --noEmit` for strict TypeScript validation.
3. Run `pnpm build` and resolve all build errors; note but do not hide non-blocking bundle warnings.
4. Manually verify in the existing supervised preview server without starting another server:
   - mock login/logout and protected-route redirects
   - direct URL load for project/task routes
   - browser back/forward behavior
   - create/edit project and task, refresh, and persistence
   - add comment/message/file metadata and refresh
   - search with mouse and keyboard
   - unread notification badge updates
   - task filters/search params survive refresh
   - calendar navigation and task opening
   - invalid route/entity states
   - mobile sidebar and compact calendar/agenda behavior
5. Keyboard-check the main path: login, sidebar navigation, global search, create task, modal close/submit, tabs, switches, notification actions.
6. Inspect responsive layouts at mobile, tablet, and desktop widths and confirm no clipped modals, overflowing filters, or unreadable calendar cells.

## Out of Scope

- Real authentication, OAuth, email recovery, APIs, databases, Supabase, realtime subscriptions, or multi-user synchronization
- Persisting actual uploaded file contents
- Drag-and-drop Kanban interactions
- A full dark theme implementation
- Project/task deletion and undo workflows
- New analytics screens or charting dependencies
- Automated browser-test infrastructure unless requested separately
