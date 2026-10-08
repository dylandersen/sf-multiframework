---
name: sf-multiframework
description: >-
  Build, review, migrate, and deploy Salesforce Multi-Framework React or Angular
  apps as UIBundle metadata. Use for uiBundles, ui-bundle.json, Data SDK and
  GraphQL integration, internal apps, Experience Cloud app containers,
  microfrontend embedding, ACC, localization, or UIBundle packaging. Also use
  when choosing Multi-Framework versus LWC. Pure LWC or generic Apex work does
  not require this skill.
license: MIT
metadata:
  version: "3.0.0"
  author: "Dylan Andersen"
  reviewed: "2026-10-08"
  sources: "Salesforce Multi-Framework guide, Microfrontend guide, published SDK declarations, and trailheadapps/multiframework-recipes"
  inspiration: "Jag Valaiyapathy SF Skills"
---

# Salesforce Multi-Framework

Build self-contained frontend apps hosted by Salesforce as `UIBundle` metadata.
React and Angular have documented templates; preserve the user's framework and
authoring tool. LWC remains the native choice for reusable platform components.

This skill was reviewed on **October 8, 2026**. Use
[official-sources.md](references/official-sources.md) for current primary links,
research findings, and scope-specific release status. Check the target org,
installed CLI help, package lockfile, and package declarations when details vary.
Treat historical demo fixes and recipe conventions as local guidance.

## Choose the relevant references

Read only what the task needs; the optional app patterns are not prerequisites.

| Task | Read |
|---|---|
| First app, org eligibility, domain setup | [overview.md](references/overview.md), [setup.md](references/setup.md), [activation-checklist.md](references/activation-checklist.md) |
| Scaffold or repair metadata | [templates.md](references/templates.md), [project-structure.md](references/project-structure.md), [cli-guide.md](references/cli-guide.md) |
| Angular implementation | [angular.md](references/angular.md) |
| Record queries, mutations, REST, schema/codegen | [data-sdk.md](references/data-sdk.md), [graphql-workflow.md](references/graphql-workflow.md), [error-handling.md](references/error-handling.md) |
| Custom labels, SDK extensions, locale formatting, app identity, host UI | [platform-capabilities.md](references/platform-capabilities.md) |
| Agentforce Employee Agent chat | [acc-integration.md](references/acc-integration.md) |
| Embed an app in Lightning or an Experience page | [microfrontends.md](references/microfrontends.md) |
| External site, guest and authenticated users | [templates.md](references/templates.md), [experience-cloud-runbook.md](references/experience-cloud-runbook.md), [permissions-csp.md](references/permissions-csp.md) |
| Tests, deployment, App Manager, access | [testing.md](references/testing.md), [ci-deploy.md](references/ci-deploy.md), [permissions-csp.md](references/permissions-csp.md) |
| Managed/unlocked 2GP distribution | [packaging.md](references/packaging.md) |
| Existing Beta app | [beta-to-ga-migration.md](references/beta-to-ga-migration.md) |
| Framework choice, failure diagnosis | [lwc-vs-react.md](references/lwc-vs-react.md), [troubleshooting.md](references/troubleshooting.md) |
| Styling or React navigation | [styling.md](references/styling.md), [react-router.md](references/react-router.md) |
| Authoring-tool setup | [authoring-surface.md](references/authoring-surface.md) |
| Educational recipes | [recipe-conventions.md](references/recipe-conventions.md) |
| Requested workspace shell or custom LLM interface | [layout-patterns.md](references/layout-patterns.md), [llm-ui-patterns.md](references/llm-ui-patterns.md) |
| Requested scored audit | [scoring-rubric.md](references/scoring-rubric.md) — local rubric, not Salesforce certification |

## Essential decisions

Infer framework, audience, org alias, existing project structure, and requested
features from the workspace before asking. Distinguish internal `CustomApplication`
apps from external `Experience` app containers, and both from iframe embedding.
A new app does not imply permission to change org-wide settings or publish it.

Eligibility is **Enterprise, Performance, Unlimited, Developer, or Partner
Developer editions on Hyperforce**, excluding Alibaba Cloud and Government Cloud.
Internal hosting needs the Salesforce app domain and Salesforce Edge Network.
Do not infer eligibility from the labels "sandbox" or "production" alone.

## Platform invariants

- Run npm commands in the bundle directory, not the DX project root. Follow the
  generated framework scripts and preserve Salesforce build/proxy integration.
- A bundle's XML uses `isActive` and an integer schema `version` (normally `1`).
  Internal apps need a companion CustomApplication with a qualified `uiBundle`
  reference, such as `c__myApp`; external apps need all four site metadata types.
- `ui-bundle.json.outputDir` must contain the built assets. Use
  `routing.fallback: "index.html"` for an SPA. Its optional `apiVersion` is a
  documented **`vXX.X` string**, distinct from DX `sourceApiVersion: "XX.X"`.
- Use `@salesforce/platform-sdk/data` for Salesforce requests; prefer
  `sdk.graphql?.query({ query, variables })` for reads and
  `sdk.graphql?.mutate({ mutation, variables })` for writes. Use `sdk.fetch?.()`
  for supported REST APIs. Never substitute raw `fetch`/`axios` to Salesforce.
- Guard missing SDK capabilities and missing `result.data`. Distinguish an
  unavailable surface or failed request from a successful query with zero rows.
  Use org schema/generated types; field envelopes such as `Name { value }`
  coexist with scalars such as `Id`.
- Queries provide `subscribe()` and `refresh()`; clean up subscriptions. These
  are cache/refresh notifications, not a server push subscription. Mutations
  do not update the query cache; refresh the relevant query after a write.
- Cache stores partition by **base URL and API version**; query keys also include
  **headers**. A cold `only-if-cached` request resolves with
  `errors[].extensions.code === "CACHE_MISS"`, rather than throwing.
- HTTP callbacks belong under `webapp.onStatus`, keyed by status code. Allow
  normal surface detection; do not invent a lowercase `"webapp"` override.
- App visibility, API Enabled, object/field access, and record sharing are
  separate grants. Deploying an access permission set does not assign it.
  UI API security does not automatically secure custom Apex REST logic.
- Use standard npm/framework APIs inside the app. LWC virtual imports such as
  `@salesforce/apex/*`, `@salesforce/schema/*`, `lightning/*`, and `@wire` are
  unavailable. Supported platform SDK `/view`, `/i18n`, and `/data/extensions`
  entry points are valid; do not ban every `@salesforce/*` package.
- ACC's verified package export is `embedAgentforceClient`, with nested
  `agentforceClientConfig`. Verify declarations before copying old
  `createAccWidget` examples. External Service Agent chat uses Enhanced Chat v2.
- Build before metadata deployment; include companion metadata and inspect the
  deployed app as its intended user. The bundle limit is **up to 2,500 files**.
  Preserve sourcemaps when managed AppExchange review requires them.

## Typical authoring path

For a new complete app, select `reactinternalapp`, `reactexternalapp`,
`angularinternalapp`, or `angularexternalapp` with `sf template generate project`.
For a bundle in an existing DX project, select `reactbasic` or `angularbasic`
with `sf template generate ui-bundle`; supply the companion metadata separately.
Check installed command help rather than treating full-project templates as
legacy bundle templates.

Install dependencies inside the bundle. Retrieve the authorized org's GraphQL
schema when needed, generate operation types with the project's scripts, and
run the framework's dev server. Local development and Live Preview do not prove
that deployed permissions, sessions, CSP, or deep routes work.

Run the existing lint/build and relevant tests. Deploy through the user's CLI
or available Salesforce DX MCP tools within the requested scope. Use actual
exposed MCP schemas rather than hardcoded tool identifiers. Launch through App
Launcher or the Experience site, assign authorized access grants, and verify
records, write results, and route refreshes. Record which checks were local and
which used the deployed org.

[assets/README.md](assets/README.md) routes to adaptable metadata and React
examples; use official templates for complete React or Angular projects. The
optional layout, chat, and scoring resources do not authorize additional work.
