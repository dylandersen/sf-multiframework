# Troubleshooting by symptom

Reviewed 2026-10-08. These are diagnostic hypotheses; confirm the actual error,
installed versions, org capabilities, and user before changing settings.

| Symptom | First checks | Reference |
|---|---|---|
| Domain/setup option absent or metadata feature gate fails | Eligible edition, Hyperforce, cloud restrictions, org release, Customize Application, app domain/Edge settings | [setup.md](setup.md) |
| Scaffold template missing | Correct command family (project versus bundle), plugin/version and `--help` | [templates.md](templates.md) |
| Vite install peer conflict | Plugin's installed Vite peer range; preserve compatible versions | [project-structure.md](project-structure.md) |
| Plugin has no named `uiBundle` export | Use default `salesforce` import matching declarations | [templates.md](templates.md) |
| Bundle version rejected | XML expects integer schema version (`1`), not `1.0.0` | [project-structure.md](project-structure.md) |
| Runtime apiVersion rejected | Current docs support `vXX.X`; distinguish runtime JSON, SDK option, and DX version formats; inspect validator/version | [ci-deploy.md](ci-deploy.md) |
| Invalid old `AppLauncher` target | Current internal target is `CustomApplication`; deploy companion qualified app reference | [beta-to-ga-migration.md](beta-to-ga-migration.md) |
| API 66 rejects CustomApplication uiBundle | Current internal metadata baseline 67+ | [ci-deploy.md](ci-deploy.md) |
| App deployed but missing from Launcher | Companion CustomApplication, `isActive`, app visibility grant/assignment; API Enabled for data | [permissions-csp.md](permissions-csp.md) |
| Shell loads but data fails | Actual launch URL/session, SDK transport, GraphQL errors, API Enabled, CRUD/FLS/sharing | [data-sdk.md](data-sdk.md) |
| SDK GraphQL response silently undefined | Capability unavailable; do not render it as empty success | [data-sdk.md](data-sdk.md) |
| Cache-only request has no data | Inspect `errors[].extensions.code === "CACHE_MISS"`; Promise need not reject | [data-sdk.md](data-sdk.md) |
| Data stale after save | Refresh retained query or requery with no-cache; mutate does not update cache | [graphql-workflow.md](graphql-workflow.md) |
| Repeated queries never reuse cache | Different headers (especially trace IDs), base URL/API partitions, partial errors, uncached surface | [data-sdk.md](data-sdk.md) |
| Field missing/null | Inspect query/schema/FLS/errors; scalars such as Id differ from field envelopes; nullable data is not proof of denied access | [graphql-workflow.md](graphql-workflow.md) |
| Mutation reports partial data and errors | Verify operation's Id/status before declaring success; reconcile before retry | [error-handling.md](error-handling.md) |
| Apex REST endpoint not found | URL mapping and deployed Apex/backend dependencies | [experience-cloud-runbook.md](experience-cloud-runbook.md) |
| Angular builds but deployed shell/assets missing | Actual Angular browser output, relative asset paths, outputDir, generated middleware/build integration | [angular.md](angular.md) |
| Deep-route hard refresh 404 | SPA fallback, actual basename, runtime URL, asset resolution | [react-router.md](react-router.md) |
| External app/site empty | All four site types; `contentBody.appContainer`, qualified appSpace; site publication/authentication | [templates.md](templates.md) |
| Public/reviewer route returns 403/empty records | Endpoint/class access, site membership, user/Contact derivation, sharing and intended security model | [experience-cloud-runbook.md](experience-cloud-runbook.md) |
| ACC import/mount fails | `embedAgentforceClient`; nested config; salesforceOrigin or frontdoorUrl; intended agent; no invented destroy/docked API | [acc-integration.md](acc-integration.md) |
| ACC session/frame fails | Cookie policy and exact app origin trusted as Lightning Out; inspect ready/error events | [acc-integration.md](acc-integration.md) |
| Embedded app fails | Correct full src, UIEmbedding/CSP settings, host event error code; do not mutate src/sandbox after mount | [microfrontends.md](microfrontends.md) |
| View SDK toast/state method absent | Standalone host or unsupported capability; supply required local UI fallback | [platform-capabilities.md](platform-capabilities.md) |
| Labels render raw keys | Manifest/namespace, translation fallback, GraphQL support; distinguish 64+ labels extension from 68+ i18n backend | [platform-capabilities.md](platform-capabilities.md) |
| Too many payload files | Audit actual build and DX payload; prune unused assets; retain managed-review sourcemaps | [packaging.md](packaging.md) |
| Package upgrade serves inactive bundle | Upgrade preserves IsActive; activate through supported org workflow and verify | [packaging.md](packaging.md) |

For application-specific layout or LLM-rendering issues, read
[layout-patterns.md](layout-patterns.md) or [llm-ui-patterns.md](llm-ui-patterns.md)
only when that architecture is relevant. Preserve server-side app/state scoping
when multiple bundles share a backend; a client filter alone is not authorization.

Record an actionable reproduction: framework, relevant package versions, CLI/API,
org edition/release/cloud, sanitized config, precise error, and intended user
permissions. Do not include credentials or full session-bearing org output.
