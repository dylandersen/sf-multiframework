# sf-multiframework

⚛️ **Salesforce Multi-Framework skill** — by Dylan Andersen · **v2.2**

Build React apps that run on the Agentforce 360 Platform via the `UIBundle` metadata type.

> Format and cross-skill conventions inspired by [Jag Valaiyapathy's SF Skills](https://github.com/Jaganpro). Built from official [Salesforce docs](references/official-sources.md) + [`trailheadapps/multiframework-recipes`](https://github.com/trailheadapps/multiframework-recipes). Deployment corrections from hands-on, end-to-end deploy testing by [Evan Jochims](https://github.com/ejochims), Distinguished, Strategic Solution Engineer at Salesforce. Works in any MCP-capable agent or IDE.

## What's New in v2.2 (GA alignment)

- **Data SDK renamed + moved**: install `@salesforce/platform-sdk`, import from the `@salesforce/platform-sdk/data` subpath (Beta was `@salesforce/sdk-data`).
- **GraphQL API split**: `.query()` for reads, `.mutate()` for writes; `result.data` is now possibly `undefined` (optional-chain it).
- **Reactive + cached queries**: `QueryResult.subscribe()` / `refresh()` (the `@wire` replacement) and a shared GraphQL cache with `cacheControl` (default 300s TTL).
- **`CustomApplication` target** replaces the Beta `AppLauncher`; employee apps now run on the dedicated **`salesforce.app`** domain.
- **No more scratch opt-in**: the deprecated `UiBundleSettings`/`webAppOptIn` config is removed — GA needs no opt-in on Summer '26+.
- **New/rewritten references**: Beta→GA migration playbook, mutation CRUD + refresh/optimistic patterns, cache-control semantics, and an LWC→React mapping.

## Status

Salesforce Multi-Framework (React) became generally available on **July 16, 2026** and now runs across **all org editions — Developer Edition, Sandbox, and Production** on the **Summer '26 release or later** with **no opt-in required** (scratch orgs remain supported for development). It requires API v67.0+ and a default org language of `en_US`, and once enabled in an org it **cannot be disabled**. Two GA changes to know: employee-facing apps run on the dedicated **`salesforce.app`** domain (each app on its own origin, isolated by the browser's Same Origin Policy), and the **Data SDK is GA** — install `@salesforce/platform-sdk`, import from the `@salesforce/platform-sdk/data` subpath (Beta shipped as `@salesforce/sdk-data`), with reads on `.query()`, writes on `.mutate()`, reactive `subscribe`/`refresh`, and a shared GraphQL cache. Roadmap: microfrontends, Angular support, localization, managed packages, and app management in App Manager.

## Requirements

| Requirement | Value |
|---|---|
| Org type | Any edition — DE, Sandbox, Production (Scratch for dev) |
| Default language | `en_US` |
| API version | v67.0+ |
| Node.js | v22+ |
| `sf` CLI | latest + `@salesforce/plugin-ui-bundle-dev` |
| External apps | Community user licenses |
| ACC | Agentforce + Employee Agent configured |

## Quick Start

```bash
# 1. Enable "Salesforce Multi-Framework" in Setup, then install the plugin
sf plugins install @salesforce/plugin-ui-bundle-dev

# 2. Scaffold (reactbasic = internal app, default = manual wiring)
sf template generate ui-bundle --name myApp --template reactbasic

# 3. Develop locally
cd force-app/main/default/uiBundles/myApp && npm install
npm run graphql:schema && npm run graphql:codegen   # types from connected org
npm run dev                                          # Vite dev server

# 4. Build + deploy (internal apps need the companion CustomApplication)
npm run build && cd ../../../../..
sf project deploy start \
  --source-dir force-app/main/default/uiBundles/myApp \
  --source-dir force-app/main/default/applications \
  --target-org TARGET
```

Internal apps require `applications/<AppName>.app-meta.xml` with `<uiBundle>myApp</uiBundle>`, deployed on **API v67.0+** and granted to users via `SetupEntityAccess`. Older Beta docs may say `reactinternalapp` / `reactexternalapp` — verify with `sf template generate ui-bundle --help`.

## Critical Rules

1. Use the Data SDK (install `@salesforce/platform-sdk`, import from `@salesforce/platform-sdk/data`) — never raw `fetch()` / `axios` to Salesforce. Reads: `sdk.graphql?.query({ query })`; writes: `sdk.graphql?.mutate({ mutation })`; `result.data` is possibly `undefined` (optional-chain it). Queries are reactive (`subscribe`/`refresh`) and cached.
2. GraphQL UI API wraps every field in `{ value }`.
3. `ui-bundle.json` needs `routing.fallback: "index.html"` for SPA refresh.
4. `.uibundle-meta.xml` `target` (`CustomApplication` vs `Experience`) is binding — not hot-swappable.
5. One styling system per component; UIBundle has a 2,500-file ceiling.
6. Inside a React bundle, `lightning/*`, `@wire`, and most `@salesforce/*` packages are unsupported (`@salesforce/platform-sdk/data`, ACC, and `@salesforce/ui-bundle` excepted).

Full rules, workflow, and the 100-point scoring rubric live in **[SKILL.md](SKILL.md)** and **[references/](references/)**.

## Cross-Skill Workflow

```
generating-apex (REST)            ─┐
developing-agentforce (Agent)     ─┤→  sf-multiframework  →  deploying-metadata
generating-permission-set (PSets) ─┘                         (CI deploy)
```

Older `sf-skills` releases name these `sf-apex`, `sf-ai-agentforce`, `sf-permissions`, `sf-deploy` — see [CREDITS.md](CREDITS.md) for the full mapping.

## License

MIT
