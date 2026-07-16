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

Generally available since **July 16, 2026** — all org editions, no opt-in, on **Summer '26+** (API v67.0+, `en_US`). The **Data SDK is GA** (`@salesforce/platform-sdk`, imported from `@salesforce/platform-sdk/data`) with reactive, cached GraphQL `.query()`/`.mutate()`. Full details in [SKILL.md](SKILL.md).

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
npx skills add dylandersen/sf-multiframework --global
```

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
