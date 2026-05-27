# Layout Patterns for Multi-Framework Apps

Patterns that have proven robust in production-style React UI bundles
(workspace apps with a left nav, a center table, and a right inspector).
These are framework-agnostic React/CSS techniques, but every one has a
Salesforce-specific wrinkle that catches new authors.

---

## 1) Three-panel app shell with state-driven CSS Grid

A workspace shell (left nav · main · right inspector) handles collapse
cleanly when you let CSS Grid own the layout and toggle class names from
React state. No per-panel `width` styles, no JS layout math.

```css
/* styles.css */
.app-shell {
  display: grid;
  grid-template-columns: var(--left-nav-w, 260px) minmax(0, 1fr) var(--inspector-w, 380px);
  grid-template-rows: auto 1fr;
  height: 100vh;
  /* Salesforce chrome offset — see section 4 */
  padding-top: var(--top-offset, 0);
}

/* Collapsed states drive the CSS variable. The grid responds automatically. */
.app-shell.nav-collapsed         { --left-nav-w: 52px; }
.app-shell.inspector-collapsed   { --inspector-w: 52px; }

/* minmax(0, 1fr) is critical — without min-width 0, an overflowing table
   inside the center column will blow the grid wider than the viewport. */
```

```tsx
function AppShell({ children }: { children: React.ReactNode }) {
  const [navCollapsed, setNavCollapsed] = usePersistedState("nav.collapsed", false);
  const [inspCollapsed, setInspCollapsed] = usePersistedState("inspector.collapsed", false);

  return (
    <div
      className={cn(
        "app-shell",
        navCollapsed && "nav-collapsed",
        inspCollapsed && "inspector-collapsed",
      )}
    >
      <LeftNav collapsed={navCollapsed} onToggle={() => setNavCollapsed(c => !c)} />
      <MainColumn>{children}</MainColumn>
      <Inspector collapsed={inspCollapsed} onToggle={() => setInspCollapsed(c => !c)} />
    </div>
  );
}
```

Key takeaways:

- **`minmax(0, 1fr)` not `1fr`** — `1fr` lets a wide table push the grid
  wider than the viewport. `minmax(0, 1fr)` makes the column shrink first.
- **Toggle classes, not inline styles** — gives you CSS transitions for
  free and keeps the React render minimal.
- **Persist collapse state per app, not per route** — sellers expect the
  shell to stay how they left it across reloads.

---

## 2) `usePersistedState` — safe localStorage for iframe surfaces

A UI bundle can run in three surfaces: Vite dev, Lightning Experience, and
Experience Cloud. In a few iframe configurations `window.localStorage`
throws on read or write. Wrap every access in try/catch and keep React
working even if storage is unavailable.

```ts
// src/lib/usePersistedState.ts
import { useEffect, useRef, useState } from "react";

export function usePersistedState<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void] {
  // Lazy initializer — read storage once on mount, never on every render.
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw == null ? initial : (JSON.parse(raw) as T);
    } catch {
      // localStorage can throw in sandboxed iframes (SecurityError) or
      // when storage is disabled (private browsing on some engines).
      // Don't crash the app shell; fall back to in-memory state.
      return initial;
    }
  });

  // Skip the very first effect run — we already seeded from storage.
  const hydrated = useRef(false);
  useEffect(() => {
    if (!hydrated.current) { hydrated.current = true; return; }
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* iframe denied */ }
  }, [key, value]);

  return [value, setValue];
}
```

Use this for: collapse state, last selected tab, column-order preference,
dismissed onboarding flags. **Never** for: AI responses, record data,
authentication tokens, anything user-private — those belong on the server.

---

## 3) Stable column resize for data tables

The single biggest layout bug in dense workspace apps: dragging a column
divider repaints the entire shell, the inspector flickers, and the user's
eye loses the cell they were looking at. Fix is two CSS lines and one
React rule.

```css
/* Force the browser to honor explicit column widths instead of recomputing
   them from content. Without this, every cell's width can change on every
   render — and a column-resize hover state causes a whole-table relayout. */
.workspace-table {
  table-layout: fixed;
  width: 100%;
}
.workspace-table th, .workspace-table td {
  /* min-width prevents columns from collapsing to 0 when the data is empty.
     overflow + text-overflow give you the "…" truncation for free. */
  min-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

```tsx
// React side: write the new width to a CSS variable on the <th>, not on
// every cell in the column. The browser doesn't recompute layout for
// sibling cells because table-layout: fixed already pinned them.
function ResizableHeader({ id, width, onResize }: Props) {
  return (
    <th style={{ width }} data-col={id}>
      {label}
      <ResizeHandle onResize={(delta) => onResize(id, width + delta)} />
    </th>
  );
}
```

React rule: **debounce the width state**, or only commit it on `pointerup`.
Updating state on every `pointermove` frame is what causes the shell to
"reflash". Use a `useRef` for the in-flight width and only call `setState`
once the user releases.

---

## 4) `--top-offset` for the Salesforce frame chrome

Internal AppLauncher apps render inside a Lightning frame with the standard
Salesforce blue header bar above your shell. If you use `height: 100vh` on
your app shell, the header eats the bottom of your content.

```css
:root {
  /* Default — Experience Cloud and Vite dev have no chrome. */
  --top-offset: 0;
}

/* When running inside Lightning Experience, the host sets a wrapper class
   on <body> (in some versions) or you can detect via window.location. */
body.in-lightning-experience {
  --top-offset: 56px; /* current chrome height; verify in your org */
}

.app-shell {
  height: calc(100vh - var(--top-offset));
}
```

Detect at boot — use the **base path** the Data SDK exposes, not user
agent sniffing:

```ts
// Lightning Experience serves the app under /lightning/n/<DeveloperName>
// Experience Cloud serves it under the site's published path
if (window.location.pathname.startsWith("/lightning/")) {
  document.body.classList.add("in-lightning-experience");
}
```

If you embed the **Agentforce Conversation Client floating mode**, ACC adds
its own bottom-right floating chrome — leave bottom padding on your inspector
column so AI suggestions and the chat button don't overlap.

---

## 5) Inspector ↔ navigation contract

The right inspector typically renders a record detail panel that can drill
into related records (Account → Opportunity → Contact). Two rules keep
this stable:

```tsx
// 1. Drive the inspector from a single piece of state (a stack), not from
//    react-router. The center column owns the URL; the inspector is a
//    side conversation that should NOT change the route.
type InspectorStack = Array<{ objectApiName: string; recordId: string }>;
const [stack, setStack] = useState<InspectorStack>([]);

const openInInspector = (objectApiName: string, recordId: string) =>
  setStack(s => [...s, { objectApiName, recordId }]);
const goBackInInspector = () => setStack(s => s.slice(0, -1));
const closeInspector = () => setStack([]);

// 2. Account links inside an inspected Opportunity panel should call
//    openInInspector, not navigate. Use intercepting click handlers on
//    server-returned HTML — see llm-ui-patterns.md section 5.
```

This pattern matches what users expect from Salesforce native record pages:
"back" returns the previous inspector context, not the previous page.

---

## 6) Skeletons that match the eventual layout

Generic spinner skeletons feel fake. Skeletons that mirror the eventual
layout feel instant. Build one skeleton per page that loads heterogeneous
data, and gate it on the same async boundaries you already use:

```tsx
function PipelinePage() {
  const { data, loading } = usePipelineQuery();
  if (loading) return <PipelineSkeleton />;
  return <PipelineTable rows={data.rows} />;
}

function PipelineSkeleton() {
  return (
    <div className="pipeline-page">
      <KPIRow.Skeleton count={4} />
      <Filters.Skeleton />
      <Table.Skeleton rows={12} columns={9} />
    </div>
  );
}
```

Skeleton components should:

- Use the **same grid/column count** as the loaded UI.
- **Not animate text content** ("Loading rows…" rotating on a timer feels
  fake; the animation is fine on the cell bars themselves).
- Render in **<16ms** — no GraphQL calls, no Apex calls. The skeleton is
  just CSS shapes.

For LLM-driven panels see [llm-ui-patterns.md](llm-ui-patterns.md) section 7
("Streaming progress without SSE").

---

## 7) Cmd-K command palette as a uniform action surface

A command palette unifies dozens of small actions (search, jump to record,
open the AI panel, change theme) into one keyboard-driven UI — and it's a
great escape hatch when you've simplified the main UI down to its
essentials. Keep one mounted at the app shell:

```tsx
function AppShell({ children }: { children: React.ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(o => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      {children}
    </>
  );
}
```

Salesforce-specific notes:

- The palette can search records via `sdk.fetch?.("/services/data/vXX.0/search/?q=…")`
  but parsed-search SOSL through Apex usually returns better-ranked results.
- Register navigation commands as relative paths (`/pipeline`, `/accounts`)
  so they work in both Lightning Experience and Experience Cloud surfaces.

---

## 8) Theming via CSS variables, not Tailwind config

A workspace app frequently needs runtime theme switching (light, dark,
matching the customer's brand). Drive everything from CSS variables, not
Tailwind config — Tailwind config is build-time and an org admin can't
re-skin the app without redeploying.

```css
:root {
  --bg-surface: #ffffff;
  --bg-elevated: #f8fafc;
  --text-primary: #0f172a;
  --border-subtle: #e2e8f0;
  --accent: #0176d3;          /* Salesforce blue — match SLDS focus ring */
  --accent-on: #ffffff;
}
[data-theme="dark"] {
  --bg-surface: #0f172a;
  --bg-elevated: #1e293b;
  --text-primary: #f8fafc;
  --border-subtle: #334155;
  --accent: #4ea1f5;
  --accent-on: #0a0f1d;
}
```

If you also use Tailwind, declare the design tokens once in CSS variables
and reference them from Tailwind:

```js
// tailwind.config.js — colors point AT the runtime vars
module.exports = {
  theme: {
    extend: {
      colors: {
        surface: "var(--bg-surface)",
        elevated: "var(--bg-elevated)",
        accent: "var(--accent)",
      },
    },
  },
};
```

Two wins: (1) runtime theme switching just sets `data-theme` on `<html>`,
(2) the Salesforce admin can override variables via a small CSS hook in
`global.css` without touching Tailwind config.

---

## 9) Responsive boundaries — what to collapse first

A Multi-Framework workspace app frequently runs at three widths:

| Width | What collapses |
|---|---|
| ≥ 1440px | Full three-panel shell, all KPI cards visible |
| 1024–1439px | Left nav becomes icon-only, KPI row scrolls horizontally |
| < 1024px | Right inspector becomes a modal, not a column |

Drive these from CSS media queries on the shell, not from per-component
JS responsive logic — JS-driven responsiveness causes layout shift on every
resize event, especially when an admin is dragging a Lightning App split
view.

```css
@media (max-width: 1439px) { .app-shell { --left-nav-w: 56px; } }
@media (max-width: 1023px) {
  .app-shell { grid-template-columns: 56px minmax(0, 1fr); }
  .inspector { position: fixed; right: 0; top: var(--top-offset); height: 100%; }
}
```

---

## Anti-patterns

### ❌ Hard-coded panel widths in JS
```tsx
const navWidth = navCollapsed ? 52 : 260;
<div style={{ gridTemplateColumns: `${navWidth}px 1fr 380px` }}>…</div>
```
Causes re-renders on every collapse change. Use class toggles + CSS vars.

### ❌ Reading from localStorage on every render
```tsx
const value = JSON.parse(localStorage.getItem("key") ?? "null");
```
Reads run on every render, throw in sandboxed iframes. Use the lazy
initializer pattern in section 2.

### ❌ Using `100vh` for the full-shell height
```css
.app-shell { height: 100vh; }
```
Eats the Lightning chrome offset. Use `calc(100vh - var(--top-offset))`.

### ❌ Layout state in URL query params
The inspector stack belongs in component state, not the URL. URL state
makes the back button toggle the inspector — surprising and rarely what
the user wants in a workspace app.

### ❌ React-managed table layout
`flexbox`-based virtualized "tables" look slick at 10 rows and fall apart
at 1000. Use a real `<table>` with `table-layout: fixed`, or a tested
library like `@tanstack/react-table`'s virtualization plugin.
