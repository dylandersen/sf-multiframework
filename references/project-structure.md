# Project Structure

Reviewed 2026-10-08 against [Project Structure and Metadata](https://developer.salesforce.com/docs/platform/multiframework/guide/mfw-project-structure.html). The detailed tree below is a React example; Angular uses `angular.json`, `esbuild/`, and `middleware/` (see [angular.md](angular.md)).

A Multi-Framework app is a **self-contained unit** under `force-app/main/default/uiBundles/<appName>/` containing both metadata and source. Application metadata and content live together — there is no separation between "Salesforce metadata" and "frontend source" the way there is for LWC.

## Canonical layout

```
multiframework-recipes/
  sfdx-project.json                 # Salesforce DX config (sourceApiVersion "67.0" or later)
  package.json                      # ROOT — SFDX metadata scripts only, NOT the React app
  data/                             # sf data import tree plans
  config/project-scratch-def.json   # Generated scratch definition; verify org eligibility
  force-app/main/default/
    applications/
      MyApp.app-meta.xml            # CustomApplication that routes App Launcher to the bundle
    uiBundles/
      myApp/                        # ← the entire React app + metadata
        myApp.uibundle-meta.xml     # UIBundle metadata definition
        ui-bundle.json              # Runtime configuration (routing, output dir)
        package.json                # React app dependencies (separate from root)
        vite.config.ts              # Vite + @salesforce/vite-plugin-ui-bundle
        tsconfig.json
        codegen.yml                 # GraphQL codegen config
        schema.graphql              # Generated from connected org (gitignored)
        scripts/
          get-graphql-schema.mjs    # Introspection helper
        src/
          app.tsx                   # Router + providers
          appLayout.tsx             # Shell (Navbar + <Outlet />)
          routes.tsx                # Route definitions
          api/
            graphqlClient.ts        # executeGraphQL wrapper
            graphql-operations-types.ts  # Generated types
            utils/
              query/                # .graphql read queries
              mutation/             # .graphql write mutations
          components/
            app/                    # Navbar, Layout, CodeBlock
            recipe/                 # Shared recipe UI (Skeleton, ContactTile)
            ui/                     # shadcn/ui primitives
          pages/                    # Route pages
          recipes/                  # Recipe components by category
          lib/                      # cn(), utilities
          styles/
            global.css              # Tailwind + design tokens
            slds.css                # SLDS imports
          assets/                   # Icons, images
        dist/                       # ← BUILD OUTPUT — what gets deployed
```

> Two `package.json` files are intentional. The root one is for SFDX scripts. The bundle one is for the React app. **Do not merge them.**

## Required files at the bundle root

### `<appName>.uibundle-meta.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<UIBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <isActive>true</isActive>
    <masterLabel>My App</masterLabel>
    <target>CustomApplication</target>
    <version>1</version>
</UIBundle>
```

| Element | Notes |
|---|---|
| `isActive` | Set `true` to make the app available |
| `masterLabel` | User-facing label |
| `target` | `CustomApplication` (internal App Launcher app) or `Experience` |
| `version` | Positive integer schema version, normally `1`; not a semantic app version |

> `AppLauncher` was the Beta-era target name. Metadata API v67.0 rejects it; use `CustomApplication` for internal apps.

Internal apps also require companion `CustomApplication` metadata. The wiring is:

```text
uiBundles/myApp/myApp.uibundle-meta.xml
  <target>CustomApplication</target>

applications/MyApp.app-meta.xml
  <uiBundle>c__myApp</uiBundle>
```

### `applications/<AppName>.app-meta.xml` for internal apps

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomApplication xmlns="http://soap.sforce.com/2006/04/metadata">
    <label>My App</label>
    <uiType>Lightning</uiType>
    <uiBundle>c__myApp</uiBundle>
    <formFactors>Large</formFactors>
    <isNavAutoTempTabsDisabled>false</isNavAutoTempTabsDisabled>
    <isNavPersonalizationDisabled>false</isNavPersonalizationDisabled>
    <isNavTabPersistenceDisabled>false</isNavTabPersistenceDisabled>
    <navType>Standard</navType>
</CustomApplication>
```

| Element | Notes |
|---|---|
| `uiBundle` | Fully qualified bundle name: `c__myApp` or `<namespace>__myApp` |
| `formFactors` | Use `Large` for desktop Lightning Experience |
| `uiType` | Use `Lightning` |

Deploying only the `UIBundle` can create runtime HTTP 400 errors because no route is registered for the app. Deploy the bundle and its `CustomApplication` together. External apps must use `<target>Experience</target>` and ship matching `digitalExperienceConfigs/`, `digitalExperiences/`, `networks/`, and `sites/` metadata. See [templates.md](templates.md).

### `ui-bundle.json`

Runtime configuration consumed by the platform when serving the app.

```json
{
  "outputDir": "dist",
  "routing": {
    "fileBasedRouting": true,
    "trailingSlash": "never",
    "fallback": "index.html",
    "rewrites": [
      { "route": "/api/*", "target": "/api/index.html" }
    ],
    "redirects": [
      { "route": "/old", "target": "/new", "statusCode": "301" }
    ]
  }
}
```

#### Property reference

| Property | Type | Required | Notes |
|---|---|---|---|
| `outputDir` | string | yes | Path relative to bundle root containing build artifacts. Vite default is `dist`. |
| `apiVersion` | string | no | Runtime version in `vXX.X` format; defaults to target org current version. Distinct from DX `sourceApiVersion`. |
| `routing.fileBasedRouting` | boolean | no | When `true`, URLs map to folder structure inside `outputDir`. Default `true`. |
| `routing.trailingSlash` | enum | no | `never` removes (`/page/` → `/page`); `always` adds; `auto` no change. |
| `routing.fallback` | string | **yes for SPAs** | File served when nothing matches. Set `index.html` for client-side routing. |
| `routing.rewrites` | array | no | Internal rewrite rules — change file served without changing URL. Supports `:id` and `*`. |
| `routing.redirects` | array | no | HTTP redirects with status `301` / `302` / `307` / `308`. Evaluated in order. |
| `routing.rewrites.route` / `.target` | string | yes | Source pattern → internal file path |
| `routing.redirects.route` / `.target` / `.statusCode` | string | yes | Source pattern → destination URL → HTTP status |

#### SPA-minimal `ui-bundle.json`

```json
{
  "outputDir": "dist",
  "routing": {
    "fallback": "index.html",
    "trailingSlash": "never"
  }
}
```

### `package.json` (bundle)

The bundle's `package.json` declares React app dependencies and scripts. Typical scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "graphql:schema": "node scripts/get-graphql-schema.mjs",
    "graphql:codegen": "graphql-codegen --config codegen.yml"
  }
}
```

Prefer `tsc --noEmit && vite build` unless you intentionally configure TypeScript project references. `tsc -b` can emit `*.tsbuildinfo`, `vite.config.js`, and `vite.config.d.ts` at the bundle root, and those files are treated as deployable `UIBundle` members unless ignored or removed.

For a non-template React project, verify current package exports and peers:

- `@salesforce/vite-plugin-ui-bundle` — wires Vite dev server to the org for live data
- `@salesforce/ui-bundle` — helper functions (auth, base path) for working with the Data SDK

### Version compatibility note

Salesforce's Vite plugin can lag the latest Vite major. If `npm install` fails with a peer conflict where `@salesforce/vite-plugin-ui-bundle` wants Vite 7 but `@vitejs/plugin-react` wants Vite 8, pin compatible majors, for example:

```json
{
  "devDependencies": {
    "@vitejs/plugin-react": "^5.2.0",
    "vite": "^7.3.2"
  }
}
```

## File-count budget

A `UIBundle` can hold up to **2,500 files**. Audit the actual payload and remove unused assets/caches. For ordinary non-review builds, sourcemaps may be disabled; managed AppExchange review requires them. See [packaging.md](packaging.md).

```ts
// vite.config.ts
build: {
  sourcemap: true    // required for managed AppExchange review; count .map files too
}
```

## Path aliases (recommended)

Define matching aliases in **both** `vite.config.ts` and `tsconfig.json` to keep imports tidy:

```ts
// vite.config.ts
resolve: {
  alias: {
    "@": "/src",
    "@api": "/src/api",
    "@components": "/src/components",
    "@utils": "/src/utils",
    "@styles": "/src/styles",
    "@assets": "/src/assets"
  }
}
```

```json
// tsconfig.json (compilerOptions)
"baseUrl": ".",
"paths": {
  "@/*":          ["src/*"],
  "@api/*":       ["src/api/*"],
  "@components/*":["src/components/*"],
  "@utils/*":     ["src/utils/*"],
  "@styles/*":    ["src/styles/*"],
  "@assets/*":    ["src/assets/*"]
}
```

## Why the bundle is self-contained

The platform treats `uiBundles/<appName>/` as one atomic unit. Deploys ship the metadata + the contents of `outputDir` together. For shared source, use a package/workspace that each build includes in its own output. Do not rely on runtime imports of undeployed sibling source; the current guide does not establish a blanket ban on build-time shared code.
