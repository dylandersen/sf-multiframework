# sf-multiframework — Asset Reference

Reference files used by the skill. **Copy and adapt** — these are minimal starters, not full-featured templates.

## `templates/`

Drop-in metadata + config files for a Multi-Framework UI bundle.

| File | Use |
|---|---|
| `myApp.uibundle-meta.xml` | UIBundle metadata. Rename file to match your `--name`. Update `<masterLabel>` and `<target>`; `<version>` is an integer schema version (`1`). |
| `MyApp.app-meta.xml` | Companion `CustomApplication` metadata for internal App Launcher apps. Update `<label>` and `<uiBundle>`. |
| `ui-bundle.json` | Runtime configuration with SPA fallback. `outputDir` is required; optional documented runtime `apiVersion` uses `vXX.X`; see project-structure.md for routing. |
| `external-content.json` | Minimal `contentBody` wiring for the generated CMS site `content.json` in external (`Experience`-target) apps. Preserve the generated nested path and surrounding metadata; update `appSpace` to `c__<DeveloperName>` (or `<Namespace>__<DeveloperName>`). |
| `vite.config.ts` | Minimal Vite config with `@salesforce/vite-plugin-ui-bundle` and path aliases. |
| `codegen.yml` | GraphQL codegen config with full UIAPI scalar mappings. Drop into the bundle root. |

## `examples/`

Reference React + GraphQL code patterns.

| File | Demonstrates |
|---|---|
| `SingleRecord.tsx` | Recipe-style inline `gql` + `{ value }` UIAPI shape + Loading / Error / Empty / Loaded states |
| `graphqlClient.ts` | One-shot Strict/Tolerant reads and a partial-result mutation helper; preserve errors and verify operation success |
| `listAccountsQuery.graphql` | External-file pattern with variables + connection pagination |
| `AccChatPanel.tsx` | Minimal Agentforce Conversation Client mount with `useRef` + cleanup |
| `global.css` | Tailwind / shadcn design-token entry point with Salesforce-blue focus ring + dark mode |

## What's intentionally not here

- A full LWR `digitalExperiences` bundle — too org-specific; start from `reactexternalapp` or `angularexternalapp` to get the companion metadata.
- Complete `package.json` for the bundle — versions move too fast; use the template scaffold.
- ESLint config — the templates ship a flat config that's well-tuned to React 19 + GraphQL ESLint plugin.

## How to use

1. Scaffold a complete app with `sf template generate project`, or use `sf template generate ui-bundle` when adding only a bundle to an existing project.
2. Use these files when you need to **understand** what the scaffold did, or when you need to **add** something to a manually-built bundle.
3. Check current official guide/package declarations; recipe examples can contain stale API text. Also compare [`trailheadapps/multiframework-recipes`](https://github.com/trailheadapps/multiframework-recipes) for the current canonical pattern.

Reviewed 2026-10-08 against published SDK/ACC/Vite plugin 12.11.0. React examples require React/TypeScript and the stated packages; they are not Angular scaffolds. ACC requires an agentId and authenticated salesforceOrigin or frontdoorUrl. Vite sourcemaps are enabled for managed AppExchange review. Minimal metadata examples still need appropriate access grants and assignment.
