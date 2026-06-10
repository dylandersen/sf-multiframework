---
name: sf-multiframework
description: >
  Salesforce Multi-Framework skill for building React apps that run on
  the Agentforce 360 Platform.
  TRIGGER when user creates or edits UI bundles (`uiBundles/`), authors React
  apps deployed via `UIBundle` metadata, configures `ui-bundle.json` /
  `.uibundle-meta.xml`, uses `@salesforce/sdk-data` (Data SDK + GraphQL), wires
  up the Agentforce Conversation Client (ACC) in React, builds custom AI/chat
  surfaces backed by Apex REST + Models API, designs three-panel workspace
  shells, scaffolds with `sf template generate ui-bundle`, or asks about
  React vs LWC choice on Salesforce.
  DO NOT TRIGGER when the work is pure LWC (use generating-lwc-components),
  generic Apex (use generating-apex), or Agentforce agent metadata and
  `.agent` script files (use developing-agentforce).
license: MIT
compatibility: "Summer '26 / API v67.0+. Requires Node.js 22+, sandbox or scratch org with default language en_US, and @salesforce/plugin-ui-bundle-dev."
metadata:
  version: "1.2.0"
  author: "Dylan Andersen"
  scoring: "100 points across 6 categories"
  sources: "Salesforce Developer Documentation + trailheadapps/multiframework-recipes"
  inspiration: "Jag Valaiyapathy SF Skills (format / rubric / orchestration conventions)"
---

# sf-multiframework

Salesforce **Multi-Framework** lets you build modern frontend apps — currently **React** — that run on the Agentforce 360 Platform via the `UIBundle` metadata type. This skill is the code-first authoring path: scaffolding a project, wiring Data SDK + GraphQL, integrating the Agentforce Conversation Client, styling, and deploying.

> **Sources.** Built from the official [Salesforce developer documentation](references/official-sources.md) (the `reactdev-*` pages under `developer.salesforce.com/docs/platform/einstein-for-devs` and `code-builder`) and code patterns distilled from [`trailheadapps/multiframework-recipes`](https://github.com/trailheadapps/multiframework-recipes). Format, rubric structure, and cross-skill orchestration conventions inspired by [Jag Valaiyapathy's SF Skills](https://github.com/Jaganpro). Written and maintained by Dylan Andersen.

> **Usable in any MCP-capable agent or IDE.** Agentforce Vibes is *one* authoring surface; this skill is designed for developers who work directly against the `sf` CLI and the Data SDK without requiring a specific assistant.

> Status: **Summer '26 / API v67.0+ mechanics**. Sandbox + scratch orgs only. English (`en_US`) default language required. Not yet available in Developer Edition orgs or Trailhead Playgrounds.

> Start here: [references/activation-checklist.md](references/activation-checklist.md)
> New to the feature? Read [references/overview.md](references/overview.md) then [references/setup.md](references/setup.md).

---

## When This Skill Owns the Task

Use `sf-multiframework` when the work involves:

- creating or editing files inside `force-app/main/.../uiBundles/<appName>/`
- authoring `ui-bundle.json` and `.uibundle-meta.xml`
- scaffolding via `sf template generate ui-bundle` (`reactbasic` / `default`; older Beta docs may mention `reactinternalapp` / `reactexternalapp`)
- using `@salesforce/sdk-data` (`createDataSDK`, `gql`, `dataSdk.graphql?.()`, `dataSdk.fetch?.()`)
- generating GraphQL types via codegen (`schema.graphql`, `graphql-operations-types.ts`)
- embedding the Agentforce Conversation Client (`@salesforce/agentforce-conversation-client`)
- choosing styling (SLDS blueprints vs `@salesforce/design-system-react` vs Tailwind/shadcn)
- deploying React UI bundles via `sf project deploy start --source-dir <bundle>`
- comparing React (Multi-Framework) vs LWC for a given use case

Delegate elsewhere when:

- task is pure LWC authoring → [generating-lwc-components](https://github.com/forcedotcom/sf-skills/tree/main/skills/generating-lwc-components) (older `sf-skills`: `sf-lwc`)
- writing/maintaining Apex called from the React app → [generating-apex](https://github.com/forcedotcom/sf-skills/tree/main/skills/generating-apex) (older `sf-skills`: `sf-apex`)
- the Conversation Client target is a Builder-managed Employee Agent and the work is on the agent itself → [developing-agentforce](https://github.com/forcedotcom/sf-skills/tree/main/skills/developing-agentforce) (older `sf-skills`: `sf-ai-agentforce` / `sf-ai-agentscript`)
- agent testing → [testing-agentforce](https://github.com/forcedotcom/sf-skills/tree/main/skills/testing-agentforce) (older `sf-skills`: `sf-ai-agentforce-testing`)
- generic deployment troubleshooting unrelated to UI bundle specifics → [deploying-metadata](https://github.com/forcedotcom/sf-skills/tree/main/skills/deploying-metadata) (older `sf-skills`: `sf-deploy`)

---

## Required Context to Gather First

Before authoring or fixing anything, infer or ask:

1. **Org type**: Sandbox or Scratch? (DE / Playgrounds are not supported in the current release.)
2. **App target**: `CustomApplication` (internal employee app) or `Experience` (external B2B/B2C portal)?
3. **Template**: `reactbasic`, `default`, or no template (manual setup)? Only use legacy names like `reactinternalapp` if `sf template generate ui-bundle --help` lists them.
4. **ACC needed?** If yes, is the agent an Employee Agent? Are cookies + Trusted Domains configured?
5. **Data access pattern**: GraphQL (preferred), UI API REST, or Apex REST?
6. **Styling system**: SLDS blueprints, `design-system-react`, or Tailwind/shadcn?
7. **Default language is `en_US`?** If not, scratch org def must set it.
8. **Shared storage/backends?** If multiple UI bundles reuse the same Apex or custom object, define an explicit app discriminator up front (for example `Source_App__c`) and enforce it on every read/write path.

---

## Activation Checklist

Verify these before authoring or fixing any Multi-Framework app:

1. **Org has Salesforce Multi-Framework enabled** in Setup. (Once enabled, **cannot be disabled**.)
2. **Salesforce CLI is current** and `@salesforce/plugin-ui-bundle-dev` is installed:
   `sf plugins install @salesforce/plugin-ui-bundle-dev`
3. **Node.js v22+** and **npm** installed.
4. **`sfdx-project.json` uses `sourceApiVersion: "67.0"` or higher**. The `uiBundle` field on `CustomApplication` does not exist in v66.0.
5. **App lives under `uiBundles/<appName>/`** with both `ui-bundle.json` and `<appName>.uibundle-meta.xml`.
6. **Internal apps include a companion `applications/<AppName>.app-meta.xml`** with `<uiBundle><appName></uiBundle>`.
7. **Internal app access is granted explicitly** by linking a permission set to the CustomApplication's `ApplicationId` via `SetupEntityAccess`.
8. **`ui-bundle.json` `outputDir` matches the build output** (`dist/` for Vite).
9. **SPA fallback** is set: `routing.fallback: "index.html"` for client-side routing.
10. **API version is managed by `sfdx-project.json` and deploy API version**. Current UI bundle validators can reject `apiVersion` inside `ui-bundle.json`.
11. **`outputDir` build artifacts exist before deploy** — run `npm run build` inside the bundle directory.
12. **For external apps**: `digitalExperiences/.../sfdc_cms_site/content.json` has `appContainer: true` and `appSpace: "<namespace>__<DeveloperName>"` (or `c__<DeveloperName>` if no namespace).
13. **For ACC**: My Domain "Require first-party use of Salesforce cookies" is **unchecked**, and the host domain is registered under **Trusted Domains for Inline Frames** (Lightning Out type).
14. **GraphQL schema is generated from a connected org** (`npm run graphql:schema`) before running codegen.
15. **Use `@salesforce/sdk-data`** for all Salesforce API calls — never `fetch()` or `axios` directly to Salesforce endpoints.
16. **Optional chaining** on SDK methods: `sdk.graphql?.()`, `sdk.fetch?.()` — they may not exist in every surface.
17. **Only one UI bundle deploys per metadata push** — keep changes scoped to one app per deploy when possible.
18. **UIBundle has a 2,500-file ceiling** — keep `dist/` lean.

Expanded version: [references/activation-checklist.md](references/activation-checklist.md)

---

## Non-Negotiable Rules

### 1) Use the Data SDK — never raw `fetch()` to Salesforce

`@salesforce/sdk-data` handles auth, CSRF, and base-path resolution across surfaces (Lightning Experience, Experience Cloud, local Vite dev). Bypassing it breaks one or more of those surfaces.

```ts
import { createDataSDK, gql } from "@salesforce/sdk-data";
const sdk = await createDataSDK();
const res = await sdk.graphql?.(MY_QUERY, variables);
```

### 2) Prefer GraphQL UI API — fall back deliberately

Order of preference for data access:

1. `sdk.graphql?.()` for queries and mutations
2. `sdk.fetch?.()` for whitelisted UI API REST / Apex REST endpoints
3. Apex REST when GraphQL can't express the operation

Never call `axios` or raw `fetch()` against Salesforce. See [references/data-sdk.md](references/data-sdk.md) for the supported endpoint list.

### 3) UI API GraphQL responses wrap every field in `{ value }`

```ts
account.Name.value;          // "Acme Corp"
account.Industry.value;      // "Technology"
response.uiapi.query.Account.edges?.map(e => e?.node);
```

This is a Salesforce-specific shape, not standard GraphQL. Comment it in code aimed at React-first developers.

### 4) `ui-bundle.json` is the routing contract

For SPAs, you almost always need:

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

Without `fallback: "index.html"` a hard refresh on `/dashboard` returns 404.

### 5) `.uibundle-meta.xml` `target` is binding

- `CustomApplication` → internal app launched from the App Launcher. Requires companion `applications/<AppName>.app-meta.xml` with `<uiBundle><bundleName></uiBundle>`.
- `Experience` → app is hosted by an Experience Cloud site and is **only** discoverable through that site's metadata. External apps require `digitalExperienceConfigs/`, `digitalExperiences/`, `networks/`, and `sites/` to coexist.

`AppLauncher` was the Beta target name and is now deprecated. Metadata API v67.0 rejects it; use `CustomApplication`.

### 6) ACC requires explicit org configuration

For Agentforce Conversation Client to render in a React app:

- An **Employee Agent** with topics + actions must exist and Agentforce must be enabled.
- **My Domain** → uncheck *Require first-party use of Salesforce cookies*.
- **Session Settings** → add the host origin (e.g. `http://localhost:5173`) under **Trusted Domains for Inline Frames** with iFrame type **Lightning Out**.
- ACC is built on **Lightning Out 2.0** as an LWCI; embed via `@salesforce/agentforce-conversation-client`'s `createAccWidget`.

Skipping any of these is the #1 cause of "the chat panel won't load" errors. See [references/acc-integration.md](references/acc-integration.md).

### 7) React app supports modern web APIs and npm only

Inside a React UI bundle these are **not supported**:

- `@salesforce/*` scoped modules **except** `@salesforce/sdk-data` (and the ACC and `@salesforce/ui-bundle` helpers)
- Lightning base components / `lightning/*` modules
- `@wire` service

If you need those, build an LWC instead.

### 8) Current limitations

- Sandbox and scratch orgs only.
- Default language must be `en_US`.
- DE orgs and Trailhead Playgrounds are **not supported**.
- Once Multi-Framework is enabled in an org, it **cannot be disabled**.

### 9) Scope persisted state per UI bundle

If multiple UI bundles share Apex services or a backing object, stamp each saved record with a stable app identifier and filter every history/state operation by that identifier. Do this in Apex (`list`, `get`, `save`, `delete`, `pin`), not just in React after fetch.

### 10) Sanitize server-returned HTML before rendering

Any HTML returned from an Apex endpoint — especially anything an LLM produced — must pass through a DOM-purify allowlist before reaching `dangerouslySetInnerHTML`. A tight tag/attr allowlist + a memoized `<SafeHtml>` component is the only correct pattern. See [references/llm-ui-patterns.md](references/llm-ui-patterns.md) sections 4–5.

### 11) Wrap `localStorage` access in try/catch

UI bundles can be hosted in sandboxed iframes where `window.localStorage` throws on read or write. Never call it directly; use the `usePersistedState` lazy-initializer pattern in [references/layout-patterns.md](references/layout-patterns.md) section 2.

---

## Recommended Authoring Workflow

### Phase 1 — Org & environment setup
- enable **Salesforce Multi-Framework** in Setup
- install Node 22+, latest `sf` CLI, Salesforce Extension Pack, `@salesforce/plugin-ui-bundle-dev`
- for external apps: enable Digital Experiences, create a placeholder site, confirm Customer/Partner Community licenses
- for ACC: configure My Domain cookies, Trusted Domains for Inline Frames, and Agentforce preference
- full sequence: [references/setup.md](references/setup.md)

### Phase 2 — Scaffold the project

```bash
# Inside an existing DX project
sf template generate ui-bundle --name myApp --template reactbasic
# or start from the minimal template and wire metadata manually
sf template generate ui-bundle --name myApp --template default

# Verify available template names against the installed plugin:
sf template generate ui-bundle --help
```

Templates: [references/templates.md](references/templates.md). Project layout: [references/project-structure.md](references/project-structure.md).

### Phase 3 — Local development

```bash
cd force-app/main/default/uiBundles/myApp
npm install
npm run graphql:schema     # introspect connected org
npm run graphql:codegen    # generate src/api/graphql-operations-types.ts
npm run dev                # Vite dev server with @salesforce/vite-plugin-ui-bundle
```

Dev server URL must be added to **Trusted Domains for Inline Frames** if you use ACC locally.

### Phase 4 — Build and deploy

```bash
npm run build                         # tsc --noEmit && vite build → dist/
cd ../../../../..                     # back to project root
sf project deploy start \
  --source-dir force-app/main/default/uiBundles/myApp \
  --source-dir force-app/main/default/applications \
  --target-org TARGET_ORG
```

Preference: deploy via the **Salesforce DX MCP** (`mcp_Salesforce_DX_deploy_metadata`) if available; CLI is the fallback.

### Phase 5 — Verify in org

- Open the org: `sf org open` → App Launcher → your app (internal) or Digital Experiences (external).
- Internal apps are served from the `.salesforce.app` domain, typically `https://<instance>--c.<pod>.my.salesforce.app/app/c__<AppDeveloperName>`. Launching from App Launcher handles the session bootstrap.
- Confirm SPA refresh works on a deep route.
- For ACC: confirm the FAB appears, the panel opens, and Lightning Types render.

---

## Data Access — The Three Patterns

### Pattern A — Inline `gql` (simple queries)

Best for recipes / single-component reads. The lesson is visible in the file.

```tsx
import { createDataSDK, gql } from "@salesforce/sdk-data";

const QUERY = gql`
  query SingleAccount {
    uiapi {
      query {
        Account(first: 1) {
          edges { node { Id Name { value } Industry { value } } }
        }
      }
    }
  }
`;

const sdk = await createDataSDK();
const res = await sdk.graphql?.(QUERY);
```

### Pattern B — External `.graphql` + codegen (complex/shared queries)

```
src/api/utils/query/singleAccountQuery.graphql
src/api/graphql-operations-types.ts        # generated
src/api/graphqlClient.ts                    # executeGraphQL wrapper
```

Use when the query has variables, fragments, or is shared across components. Run `npm run graphql:codegen` after every edit.

### Pattern C — `sdk.fetch?.()` for REST

For UI API REST or Apex REST that GraphQL can't express. Allow-list and patterns: [references/data-sdk.md](references/data-sdk.md).

---

## Error Handling — Three Strategies

GraphQL can return `data` AND `errors` in the same response. Pick the strategy per call site:

| Strategy | When to use |
|---|---|
| **Strict** — fail on any error | data integrity matters; partial data is misleading |
| **Tolerant** — log errors, use partial data | optional fields; UI degrades gracefully |
| **Permissive** — only fail when no data at all | mutations that succeed but can't read back every field |

For `sdk.fetch?.()` errors: wrap transport errors, then check HTTP status, then handle 401 / 403 with sign-in / permission flows. Full patterns: [references/error-handling.md](references/error-handling.md).

---

## Styling — Three Approaches

| Approach | Use when |
|---|---|
| **SLDS blueprints** (CSS classes) | You want native Salesforce look, full markup control, latest SLDS not auto-applied |
| **`@salesforce/design-system-react`** | You want SLDS components and accept an older pinned SLDS CSS |
| **Tailwind + shadcn/ui** | You want a custom branded look or are building a fresh design system |

You can mix at the **app shell** vs **recipe/page** boundary, but **don't mix inside one component** — pick one system per component. Tokens, dark mode, and SLDS focus-ring color guidance: [references/styling.md](references/styling.md).

---

## LLM-Driven UI — Roll Your Own AI Surface

When you want React to own the chat chrome and Apex to own the brain (custom intent classification, deterministic record lookup, branded conversation UI), use these patterns instead of ACC. Full reference: [references/llm-ui-patterns.md](references/llm-ui-patterns.md).

| Pattern | Why |
|---|---|
| Single `@RestResource` with an `action` dispatcher in the body | One CSP rule, one URL mapping, action-by-action evolution |
| Opaque `executionDataJson` round-trip through React | React doesn't need to know the server's intermediate schema |
| Conversation history + `[WORKSPACE_STATE: {…}]` block | Lets the LLM resolve "yes" / "draft an email" without re-asking |
| `<SafeHtml>` with `memo` + `useMemo` + DOMPurify allowlist | Long chat threads sanitize once per turn, not per keystroke |
| Lightning record links via relative `/lightning/r/<obj>/<id>/view` | Routes inside the frame in both Lightning Experience and Experience Cloud |
| `<SUGGESTIONS>` / `<CHART>` fenced blocks the server strips before send | Single LLM call returns HTML + structured data |
| "Fast path" — skip the Pass-2 LLM when the answer is just records | ~1.5–3 s saved per "list me X" turn, zero hallucination surface |
| Honest failure copy (AI down / not found / render failed / SOQL invalid) | "Too broad" generic copy blames the user; this distinguishes root cause |

If you only need a pre-built chat widget that talks to an Employee Agent, use **Agentforce Conversation Client** instead — see [references/acc-integration.md](references/acc-integration.md). ACC owns the rendering, history, and styling for you.

---

## Layout & Shell Patterns

Workspace-style apps (left nav · main · right inspector) share a small set of patterns that catch first-time authors out. Full reference: [references/layout-patterns.md](references/layout-patterns.md).

| Pattern | One-line takeaway |
|---|---|
| Three-panel CSS Grid with `minmax(0, 1fr)` and class-toggled CSS vars | Lets a wide table shrink rather than blowing the grid past the viewport |
| `usePersistedState` (lazy initializer + try/catch) | Survives sandboxed-iframe `localStorage` SecurityError |
| `table-layout: fixed` + state debounced on `pointerup` | Column resize stops re-flowing the entire shell |
| `--top-offset` CSS variable for Lightning chrome | Don't lose the bottom of your shell to the blue header bar |
| Inspector stack in component state, not in the URL | "Back" returns the previous inspector context, not the previous page |
| Layout-matching skeletons (same grid, same column count) | Beats spinner + rotating "Loading…" copy that feels fake |
| Cmd-K command palette mounted at the shell | One uniform keyboard surface for navigation + actions |
| Theme tokens in CSS variables (Tailwind config references them) | Runtime theme switching without a redeploy |

---

## ACC Integration — Quick Path

1. Confirm prerequisites in [references/acc-integration.md](references/acc-integration.md) (Employee Agent, cookies, Trusted Domains, Agentforce preference).
2. Add the package: `npm install @salesforce/agentforce-conversation-client`.
3. Mount via `createAccWidget` inside a `useEffect` keyed off a `useRef` container.
4. Configure dock/floating/inline mode and styling tokens via SDK options.
5. For pure programmatic open/close from inside a custom LWC (no React), use the ACC API instead of this skill.

---

## Cross-Skill Orchestration

| Task | Delegate to | Older `sf-skills` alias |
|---|---|---|
| Build Apex REST / Apex controllers called by the app | [generating-apex](https://github.com/forcedotcom/sf-skills/tree/main/skills/generating-apex) | `sf-apex` |
| Author or fix the Employee Agent that ACC connects to | [developing-agentforce](https://github.com/forcedotcom/sf-skills/tree/main/skills/developing-agentforce) | `sf-ai-agentforce` / `sf-ai-agentscript` |
| Test the Employee Agent | [testing-agentforce](https://github.com/forcedotcom/sf-skills/tree/main/skills/testing-agentforce) | `sf-ai-agentforce-testing` |
| Permission sets / profiles for the bundle | [generating-permission-set](https://github.com/forcedotcom/sf-skills/tree/main/skills/generating-permission-set) | `sf-permissions` |
| Deploy at scale / CI | [deploying-metadata](https://github.com/forcedotcom/sf-skills/tree/main/skills/deploying-metadata) | `sf-deploy` |
| SOQL helpers for Apex backing the app | [querying-soql](https://github.com/forcedotcom/sf-skills/tree/main/skills/querying-soql) | `sf-soql` |

---

## High-Signal Failure Patterns

| Symptom | Likely cause | Read next |
|---|---|---|
| Hard refresh on a sub-route returns 404 | `routing.fallback` not set to `index.html` | [references/project-structure.md](references/project-structure.md) |
| Local dev fetches succeed, deployed fetches 401/403 | bypassing Data SDK or hitting non-allowlisted endpoint | [references/data-sdk.md](references/data-sdk.md) |
| `Cannot read properties of undefined (reading 'value')` on GraphQL data | forgetting the UI API `{ value }` field wrapper | [references/data-sdk.md](references/data-sdk.md), [references/graphql-workflow.md](references/graphql-workflow.md) |
| Codegen produces no types | `schema.graphql` missing — never ran `npm run graphql:schema` | [references/graphql-workflow.md](references/graphql-workflow.md) |
| ACC FAB never appears | Trusted Domains not registered, or "Require first-party Salesforce cookies" still on | [references/acc-integration.md](references/acc-integration.md) |
| ACC loads but disconnects on navigation | cookie policy / iframe origin mismatch | [references/acc-integration.md](references/acc-integration.md) |
| External app deploys but never appears in Digital Experiences | `appContainer: true` or `appSpace` not set, or namespace prefix wrong | [references/templates.md](references/templates.md) |
| Mutation succeeds but read-back errors | UI API mutation return shape can't include some fields — switch to Permissive error strategy | [references/error-handling.md](references/error-handling.md) |
| Build succeeds but deploy fails with file count error | UIBundle 2,500-file limit; prune `dist/` source maps or unused assets | [references/troubleshooting.md](references/troubleshooting.md) |
| Deploy fails on `apiVersion`, `isEnabled`, or unknown `ui-bundle.json` keys | UIBundle metadata/runtime schema drift; use `isActive` + `version`, omit `apiVersion` from `ui-bundle.json` | [references/project-structure.md](references/project-structure.md), [references/ci-deploy.md](references/ci-deploy.md) |
| Deploy fails with `Invalid Target value 'AppLauncher'` | stale Beta metadata target | use `<target>CustomApplication</target>` and API v67.0+ |
| Deploy fails with `Property 'uiBundle' not valid in version 66.0` | `sfdx-project.json` still on v66.0 | set `sourceApiVersion` to `67.0` or higher |
| Deployed internal app returns HTTP 400 `Could not determine handler` | missing companion `CustomApplication` metadata | add `applications/<AppName>.app-meta.xml` with `<uiBundle><bundleName></uiBundle>` |
| Internal app exists in `AppMenuItem` with `IsAccessible: false` | app access not granted via `SetupEntityAccess` | link the app `ApplicationId` to a permission set |
| Deploy includes `vite.config.js`, `.d.ts`, or `*.tsbuildinfo` | `tsc -b` emitted TypeScript artifacts into the bundle root | [references/project-structure.md](references/project-structure.md), [references/ci-deploy.md](references/ci-deploy.md) |
| `npm install` fails with Vite peer conflict | Salesforce Vite plugin lags the latest Vite major | [references/project-structure.md](references/project-structure.md), [references/troubleshooting.md](references/troubleshooting.md) |
| `sf template generate ui-bundle` is not recognized | `@salesforce/plugin-ui-bundle-dev` not installed | [references/cli-guide.md](references/cli-guide.md) |
| Feature toggle missing in Setup | org is DE / Playground (not supported), or default language ≠ `en_US` | [references/setup.md](references/setup.md) |
| Navigation works locally, breaks in Lightning Experience | `basename` not derived from `SFDC_ENV.basePath` | [references/react-router.md](references/react-router.md) |
| Build error: "no exported member BrowserRouter" | importing from `react-router-dom` instead of `react-router` (v7) | [references/react-router.md](references/react-router.md) |
| Image / font / analytics blocked with CSP console error | missing `CspTrustedSite` metadata | [references/permissions-csp.md](references/permissions-csp.md) |
| Field value is always `null` in production | FLS / object permissions missing in the user's permission set | [references/permissions-csp.md](references/permissions-csp.md) |
| `axe` tests throw `getContext is not a function` | `vitest.setup.ts` missing the jsdom `HTMLCanvasElement` stub | [references/testing.md](references/testing.md) |
| Scratch org deploy fails with feature-not-enabled | scratch def missing `UIBundleSettings.webAppOptIn: true` | [references/ci-deploy.md](references/ci-deploy.md) |
| Chat history or saved state from another UI bundle appears | shared Apex/object persistence is missing a per-app discriminator such as `Source_App__c` | [references/troubleshooting.md](references/troubleshooting.md) |
| LLM-generated HTML renders as escaped text in the chat bubble | wrapping with `<SafeHtml>` missing; raw `{html}` interpolated instead of `dangerouslySetInnerHTML` | [references/llm-ui-patterns.md](references/llm-ui-patterns.md) |
| Long chat thread re-runs DOMPurify on every keystroke in the composer | `<SafeHtml>` not wrapped in `React.memo` / `useMemo` | [references/llm-ui-patterns.md](references/llm-ui-patterns.md) |
| Record links inside chat HTML cause a hard navigation that leaves the app frame | absolute `https://…force.com/…` URL used instead of relative `/lightning/r/<obj>/<id>/view` | [references/llm-ui-patterns.md](references/llm-ui-patterns.md) |
| Chat responds to "yes" or "draft that email" with "I'm not sure what you mean" | missing `[WORKSPACE_STATE: {…}]` block and prior turns in the request body | [references/llm-ui-patterns.md](references/llm-ui-patterns.md) |
| Every "list me X" question takes 8–12 s even though the answer is just records | Pass-2 LLM call running unnecessarily; missing the `directResponse` fast path | [references/llm-ui-patterns.md](references/llm-ui-patterns.md) |
| Generic "query may have been too broad" chat bubble even when AI service was down | failure-copy branching collapsed to one bucket on the Apex side | [references/llm-ui-patterns.md](references/llm-ui-patterns.md) |
| Inspector / nav collapse state resets on every page reload | `localStorage` read/write not wrapped in try/catch (threw SecurityError in iframe) | [references/layout-patterns.md](references/layout-patterns.md) |
| Dragging a column divider re-flows the entire shell and flickers the inspector | `<table>` missing `table-layout: fixed`, or width state updated on every `pointermove` frame | [references/layout-patterns.md](references/layout-patterns.md) |
| Wide table pushes the app shell wider than the viewport with horizontal scroll | grid column declared as `1fr` instead of `minmax(0, 1fr)` | [references/layout-patterns.md](references/layout-patterns.md) |
| Bottom of the app shell is clipped by the Lightning header | `height: 100vh` not subtracting `var(--top-offset)` | [references/layout-patterns.md](references/layout-patterns.md) |
| Inspector "back" button navigates the page instead of popping the panel stack | inspector state driven from `react-router` instead of a local stack | [references/layout-patterns.md](references/layout-patterns.md) |

---

## Reference Map

### Start here
- [references/activation-checklist.md](references/activation-checklist.md)
- [references/overview.md](references/overview.md)
- [references/setup.md](references/setup.md)

### Project mechanics
- [references/project-structure.md](references/project-structure.md)
- [references/templates.md](references/templates.md)
- [references/cli-guide.md](references/cli-guide.md)

### Data access
- [references/data-sdk.md](references/data-sdk.md)
- [references/graphql-workflow.md](references/graphql-workflow.md)
- [references/error-handling.md](references/error-handling.md)

### UI / experience
- [references/styling.md](references/styling.md)
- [references/layout-patterns.md](references/layout-patterns.md)
- [references/acc-integration.md](references/acc-integration.md)
- [references/llm-ui-patterns.md](references/llm-ui-patterns.md)
- [references/recipe-conventions.md](references/recipe-conventions.md)
- [references/react-router.md](references/react-router.md)

### Security & access
- [references/permissions-csp.md](references/permissions-csp.md)

### Testing & delivery
- [references/testing.md](references/testing.md)
- [references/ci-deploy.md](references/ci-deploy.md)

### Authoring surface
- [references/authoring-surface.md](references/authoring-surface.md)

### Decisions & troubleshooting
- [references/lwc-vs-react.md](references/lwc-vs-react.md)
- [references/troubleshooting.md](references/troubleshooting.md)
- [references/scoring-rubric.md](references/scoring-rubric.md)
- [references/official-sources.md](references/official-sources.md)

### Examples / scaffolds
- [assets/templates/](assets/templates/)
- [assets/examples/](assets/examples/)

---

## Score Guide

| Score | Meaning |
|---|---|
| 90+ | Deploy with confidence |
| 75–89 | Good, review warnings |
| 60–74 | Needs focused revision |
| < 60 | Block deploy |

Full rubric: [references/scoring-rubric.md](references/scoring-rubric.md)

---

## Official Resources

See [references/official-sources.md](references/official-sources.md) for Salesforce docs and reference implementations.
