# sf-multiframework

⚛️ **Salesforce Multi-Framework skill** — by Dylan Andersen · **v2.2**

An agent skill that teaches your AI coding agent to build, wire, and deploy **React apps on the Salesforce Agentforce 360 Platform** (the `UIBundle` metadata type) the right way — Data SDK + GraphQL, routing, styling, permissions, and CI deploy — plus a 100-point scoring rubric it can use to grade its own output.

> Format and cross-skill conventions inspired by [Jag Valaiyapathy's SF Skills](https://github.com/Jaganpro). Built from official [Salesforce docs](references/official-sources.md) + [`trailheadapps/multiframework-recipes`](https://github.com/trailheadapps/multiframework-recipes). Deployment corrections from hands-on, end-to-end deploy testing by [Evan Jochims](https://github.com/ejochims), Distinguished, Strategic Solution Engineer at Salesforce. Works in any MCP-capable agent or IDE.

## Install

```bash
npx skills add dylandersen/sf-multiframework --global
```

## When to use it

Your agent should reach for this skill whenever you ask it to scaffold, build, review, or deploy a Salesforce Multi-Framework / `UIBundle` React app — for example "build a React app for Salesforce", "query records with the Data SDK", or "deploy my UIBundle".

## What's inside

- **[SKILL.md](SKILL.md)** — the core rules, build/deploy workflow, and 100-point scoring rubric.
- **[references/](references/)** — deep dives: Data SDK & GraphQL, error handling, Beta→GA migration, routing, styling, testing, CI deploy, permissions/CSP, LWC↔React mapping, and more.
- **[assets/](assets/)** — ready-to-copy templates and examples (`vite.config.ts`, metadata XML, GraphQL client, sample components).

## Compatibility

Targets Salesforce Multi-Framework **GA (July 16, 2026)** — Summer '26+, API v67.0+, all org editions. Uses the GA **Data SDK** (`@salesforce/platform-sdk`, imported from `@salesforce/platform-sdk/data`).

## What's New in v2.2 (GA alignment)

- **Data SDK renamed + moved**: install `@salesforce/platform-sdk`, import from the `@salesforce/platform-sdk/data` subpath (Beta was `@salesforce/sdk-data`).
- **GraphQL API split**: `.query()` for reads, `.mutate()` for writes; `result.data` is now possibly `undefined` (optional-chain it).
- **Reactive + cached queries**: `QueryResult.subscribe()` / `refresh()` (the `@wire` replacement) and a shared GraphQL cache with `cacheControl` (default 300s TTL).
- **`CustomApplication` target** replaces the Beta `AppLauncher`; employee apps now run on the dedicated **`salesforce.app`** domain.
- **No more scratch opt-in**: the deprecated `UiBundleSettings`/`webAppOptIn` config is removed — GA needs no opt-in on Summer '26+.
- **New/rewritten references**: Beta→GA migration playbook, mutation CRUD + refresh/optimistic patterns, cache-control semantics, and an LWC→React mapping.

## Cross-Skill Workflow

```
generating-apex (REST)            ─┐
developing-agentforce (Agent)     ─┤→  sf-multiframework  →  deploying-metadata
generating-permission-set (PSets) ─┘                         (CI deploy)
```

Older `sf-skills` releases name these `sf-apex`, `sf-ai-agentforce`, `sf-permissions`, `sf-deploy` — see [CREDITS.md](CREDITS.md) for the full mapping.

## License

MIT
