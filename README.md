# sf-multiframework

⚛️ **Salesforce Multi-Framework skill** — by Dylan Andersen

Build React apps that run on the Agentforce 360 Platform via the `UIBundle` metadata type.

> Format and cross-skill conventions inspired by [Jag Valaiyapathy's SF Skills](https://github.com/Jaganpro). Built from official [Salesforce docs](references/official-sources.md) + [`trailheadapps/multiframework-recipes`](https://github.com/trailheadapps/multiframework-recipes). Soft GA deployment corrections by [Evan Jochims](https://github.com/ejochims), Distinguished, Strategic Solution Engineer at Salesforce. Works in any MCP-capable agent or IDE.

## Status — Soft GA (June 3, 2026)

Salesforce Multi-Framework (React) reached **Accelerated ("Soft") GA on June 3, 2026**. It now runs across **all org editions — Developer Edition, Sandbox, and Production** (scratch orgs remain supported for development). API v67.0+ · default language `en_US` · **cannot be disabled once enabled**.

Now generally available: React app deployment with full platform integration (auth, security, governance) via app templates, feature skills, CMS content, and the new Salesforce App Domain (incl. ACC integration); Salesforce DX workflows for managing React apps alongside other metadata; Agentforce Vibes 1.0 "vibe coding"; App Access Control (B2E) so non-admins can't reach B2E apps by direct URL or App Launcher without entitlement; and a refreshed admin app-management UX in Setup. Full GA (incl. Agentforce Vibes 2.0) is targeted next.

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

1. Use `@salesforce/sdk-data` — never raw `fetch()` / `axios` to Salesforce.
2. GraphQL UI API wraps every field in `{ value }`.
3. `ui-bundle.json` needs `routing.fallback: "index.html"` for SPA refresh.
4. `.uibundle-meta.xml` `target` (`CustomApplication` vs `Experience`) is binding — not hot-swappable.
5. One styling system per component; UIBundle has a 2,500-file ceiling.
6. Inside a React bundle, `lightning/*`, `@wire`, and most `@salesforce/*` packages are unsupported (`@salesforce/sdk-data`, ACC, and `@salesforce/ui-bundle` excepted).

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
