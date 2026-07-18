# sf-multiframework

⚛️ **Salesforce Multi-Framework skill** — by Dylan Andersen

Build React apps that run on the Agentforce 360 Platform via the `UIBundle` metadata type.

> Format and cross-skill conventions inspired by [Jag Valaiyapathy's SF Skills](https://github.com/Jaganpro). Built from official [Salesforce docs](references/official-sources.md) + [`trailheadapps/multiframework-recipes`](https://github.com/trailheadapps/multiframework-recipes). Deployment corrections from hands-on, end-to-end deploy testing by [Evan Jochims](https://github.com/ejochims), Distinguished, Strategic Solution Engineer at Salesforce. Works in any MCP-capable agent or IDE.

## How to Install

Install this skill with the [`skills`](https://www.npmjs.com/package/skills) CLI:

```bash
npx skills install dylandersen/sf-multiframework
```

This pulls the skill into your agent's skills directory so it's available in any MCP-capable agent or IDE.

## Status

Salesforce Multi-Framework (React) became generally available on June 3, 2026 and now runs across **all org editions — Developer Edition, Sandbox, and Production** (scratch orgs remain supported for development). It requires API v67.0+ and a default org language of `en_US`, and once enabled in an org it **cannot be disabled**. Available today: React app deployment with full platform integration (auth, security, governance), Salesforce DX workflows, Agentforce Vibes 1.0 "vibe coding", App Access Control for B2E apps, and a refreshed admin app-management UX — with more capabilities (including Agentforce Vibes 2.0) on the way.

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

# 2. Scaffold a bundle into an existing project
sf template generate ui-bundle --name myApp --template reactbasic

# Or scaffold a full generated internal/external project when listed by your CLI
sf template generate project --name myPortal --template reactexternalapp --api-version 67.0

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

Internal apps require `applications/<AppName>.app-meta.xml` with `<uiBundle>c__MyApp</uiBundle>` or the generated equivalent, deployed on **API v67.0+** and granted to users via `SetupEntityAccess`. External apps require the generated Experience metadata stack, site publish, guest/auth Apex access, and deliberate public/reviewer data scoping — see [references/experience-cloud-runbook.md](references/experience-cloud-runbook.md). Older Beta docs may say `reactinternalapp` / `reactexternalapp` in different command contexts, so verify both `sf template generate ui-bundle --help` and `sf template generate project --help`.

## Critical Rules

1. Use `@salesforce/platform-sdk` — never raw `fetch()` / `axios` to Salesforce.
2. GraphQL UI API wraps every field in `{ value }`.
3. `ui-bundle.json` needs `routing.fallback: "index.html"` for SPA refresh.
4. `.uibundle-meta.xml` `target` (`CustomApplication` vs `Experience`) is binding — not hot-swappable.
5. One styling system per component; UIBundle has a 2,500-file ceiling.
6. Inside a React bundle, `lightning/*`, `@wire`, and most `@salesforce/*` packages are unsupported (`@salesforce/platform-sdk`, ACC, and `@salesforce/ui-bundle` excepted).

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
