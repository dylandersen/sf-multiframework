# React Router 7 on Salesforce Multi-Framework

Current React templates/recipes use **React Router 7**; it is a project choice, not a platform mandate. Two things are non-obvious vs plain-web React Router:

1. Current recipes import from `react-router`; preserve compatible routing dependencies in existing apps.
2. The platform injects a base path at runtime that the router must pick up, or deep links and navigation break inside Lightning Experience / Experience Cloud.

## Install and import

```bash
npm install react-router
```

```tsx
// ✅ correct — v7 consolidated everything into the main package
import { createBrowserRouter, RouterProvider, Link, NavLink, Outlet, useNavigate, useParams, useLocation } from "react-router";

// Existing apps may use react-router-dom; check installed version/exports first.
import { BrowserRouter } from "react-router-dom";
```

## The `SFDC_ENV.basePath` contract

At runtime, Salesforce mounts the app under a URL like:

```
/app/c__myApp                         # illustrative internal app path; copy actual launch URL
/<site>/...                           # external path depends on the generated site/runtime
```

The platform sets `globalThis.SFDC_ENV.basePath` so the app knows where it is mounted. The router must use that as its `basename`, otherwise:

- hard refreshes on nested routes (e.g. `/read-data/001XXX`) return 404
- `Link` / `navigate` produce URLs that double-prefix the base path
- `useLocation().pathname` doesn't match route definitions

### Canonical entry point

```tsx
// src/app.tsx
import { createBrowserRouter, RouterProvider } from "react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { routes } from "./routes";
import "./styles/global.css";
import "./styles/slds.css";

// Strip any trailing slash so the basename matches route paths like "/read-data"
const rawBasePath = (globalThis as any).SFDC_ENV?.basePath;
const basename =
  typeof rawBasePath === "string" ? rawBasePath.replace(/\/+$/, "") : undefined;

const router = createBrowserRouter(routes, { basename });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
```

If `SFDC_ENV` is undefined (running outside an org surface, e.g. `vite preview`), `basename` stays `undefined` and the router uses `/` — this is what lets local dev work without conditionals.

## `ui-bundle.json` must match router config

React Router does client-side routing; the platform has to serve `index.html` for every path, otherwise hard-refreshing a non-root route returns 404.

```json
{
  "outputDir": "dist",
  "routing": {
    "fileBasedRouting": true,
    "trailingSlash": "never",
    "fallback": "index.html"
  }
}
```

The three fields that matter:

| Field | Required for SPA | Why |
|---|---|---|
| `routing.fallback: "index.html"` | yes | Platform serves the shell on every unmatched path → client router takes over |
| `routing.trailingSlash: "never"` | recommended | Matches how React Router emits URLs; avoids dupes |
| `routing.fileBasedRouting` | depends | `true` maps `public/*.html` files to routes; most React SPAs keep it on because the root `index.html` still matters |

## Route definition pattern

Keep routes in `src/routes.tsx` as `RouteObject[]`, not JSX. This is the shape `createBrowserRouter` expects, and it makes routes inspectable:

```tsx
// src/routes.tsx
import type { RouteObject } from "react-router";
import AppLayout from "@/appLayout";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import ReadData from "./pages/ReadData";
import ModifyData from "./pages/ModifyData";
import { RouteParametersDetail } from "./recipes/routing/RouteParameters";

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Home /> },
      {
        path: "read-data",
        element: <ReadData />,
        handle: { showInNavigation: true, label: "Read Data" },
      },
      {
        path: "modify-data",
        element: <ModifyData />,
        handle: { showInNavigation: true, label: "Modify Data" },
      },
      {
        path: "route-parameters",
        element: <RouteParametersPage />,
        handle: { showInNavigation: true, label: "Route Parameters" },
        children: [{ path: ":accountId", element: <RouteParametersDetail /> }],
      },
      { path: "*", element: <NotFound /> },
    ],
  },
];
```

### The `handle` pattern for dynamic navbars

React Router exposes each route's `handle` on `useMatches()`. Use the route catalog for a full navbar; `useMatches()` exposes only active matches and can drive breadcrumbs or active-context UI. The following renders only those active entries:

```tsx
// appLayout.tsx
import { useMatches, Outlet, NavLink } from "react-router";

interface NavHandle { showInNavigation?: boolean; label?: string }

export default function AppLayout() {
  const matches = useMatches();
  // useMatches contains active matches only, not the full navigation catalog.
  const navRoutes = matches
    .filter(m => (m.handle as NavHandle | undefined)?.showInNavigation)
    .map(m => ({ path: m.pathname, label: (m.handle as NavHandle).label ?? m.id }));

  return (
    <div>
      <nav>
        {navRoutes.map(r => (
          <NavLink key={r.path} to={r.path}>{r.label}</NavLink>
        ))}
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
```

## Route parameters

```tsx
// src/recipes/routing/RouteParameters.tsx
import { useParams, Link } from "react-router";

export function RouteParametersDetail() {
  const { accountId } = useParams<{ accountId: string }>();
  // fetch / render using accountId
}

// Link into the detail route:
<Link to={`/route-parameters/${account.Id}`}>{account.Name.value}</Link>
```

Parameters come back as `string | undefined`. Don't assume they're present — declare the shape with a generic.

## Nested routes with a shared layout

```tsx
{
  path: "nested-routes",
  element: <NestedRoutesPage />,   // page shell (headings, chrome)
  children: [
    {
      element: <NestedRoutes />,   // layout for the nested section
      children: [
        { index: true, element: <NestedRoutesIndex /> },
        { path: ":accountId", element: <NestedRoutesDetail /> },
      ],
    },
  ],
},
```

The layout component renders `<Outlet />` and each child fills in. This is the pattern for master-detail flows.

## Programmatic navigation

```tsx
import { useNavigate } from "react-router";

function CreateAccountForm() {
  const navigate = useNavigate();
  async function onSubmit(e: FormEvent) {
    // ... create record ...
    navigate(`/read-data/${newId}`);
  }
}
```

`useNavigate()` respects the router's `basename` — don't prepend `SFDC_ENV.basePath` yourself.

## Common failures

| Symptom | Cause | Fix |
|---|---|---|
| 404 on hard refresh of a child route in Lightning | `ui-bundle.json` missing `fallback: "index.html"` | Add it and redeploy |
| Navbar links duplicate the runtime mount prefix | Manually prepending `SFDC_ENV.basePath` inside the app | Let `basename` handle it; use relative `to="read-data"` or `to="/read-data"` |
| Routes work locally, break inside an Experience Cloud site | `basename` defaulted to `/` instead of picking up `SFDC_ENV.basePath` | Read `SFDC_ENV.basePath` at `createBrowserRouter` time |
| Router export missing | Installed dependency/export mismatch | Inspect package versions and use supported exports |
| `useParams()` returns `{}` | Route defined without `:paramName` | Match the path pattern to the param key |

## What NOT to use

- Do not migrate a working `react-router-dom` setup merely to match a recipe; verify compatibility first.
- Prefer the generated browser-router/basename path; choose hash routing only if its URL behavior meets the app requirements.
- A custom router layer on top of React Router — the platform already solves base-path and hard-refresh via `ui-bundle.json` + `basename`
