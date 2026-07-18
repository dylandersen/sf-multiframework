# Templates and generated project shapes

Salesforce CLI exposes two related template command families. Check the installed plugin before choosing names; generated output is the source of truth when examples and templates drift.

```bash
sf template generate ui-bundle --help
sf template generate project --help
```

## Command matrix

| Command | Typical templates | Use when |
|---|---|---|
| `sf template generate ui-bundle` | `default`, `reactbasic`, sometimes `angularbasic` | You already have an SFDX project and want to add one UI Bundle. |
| `sf template generate project` | `standard`, `empty`, `analytics`, `reactinternalapp`, `reactexternalapp`, `agent` when listed | You want the CLI to scaffold a fuller project/app shape, including internal or external companion metadata. |

Older Beta docs sometimes mention `reactinternalapp` / `reactexternalapp` as UI-bundle templates. In current CLI builds observed during the Community Resilience Grants demo, those names belonged to `sf template generate project`, while `sf template generate ui-bundle` exposed `default` and `reactbasic`.

## `reactbasic` — React app starter

**Audience:** employees signing in with Salesforce credentials.
**Target:** `CustomApplication` for internal apps, or `Experience` if you add Experience Cloud metadata.
**Includes:**

- Pre-wired Vite + TypeScript + Tailwind + shadcn/ui shell
- Object search using GraphQL UI API
- **Agentforce Conversation Client** integration (assumes ACC org config is complete)
- Recommended folder structure (`recipes/`, `pages/`, `components/`)

When to pick it:
- Single-page employee app inside Salesforce.
- Users are already authenticated.
- You plan to embed an Employee Agent.

```bash
sf template generate ui-bundle --name myEmployeeApp --template reactbasic
```

For an internal App Launcher app, add the companion CustomApplication metadata. Current generated project templates may namespace-qualify the UI Bundle reference (`c__MyEmployeeApp`); if manual metadata fails, compare against freshly generated output.

```xml
<!-- force-app/main/default/applications/MyEmployeeApp.app-meta.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<CustomApplication xmlns="http://soap.sforce.com/2006/04/metadata">
    <label>My Employee App</label>
    <uiType>Lightning</uiType>
    <uiBundle>c__MyEmployeeApp</uiBundle>
    <formFactors>Large</formFactors>
    <isNavAutoTempTabsDisabled>false</isNavAutoTempTabsDisabled>
    <isNavPersonalizationDisabled>false</isNavPersonalizationDisabled>
    <isNavTabPersistenceDisabled>false</isNavTabPersistenceDisabled>
    <navType>Standard</navType>
</CustomApplication>
```

## `default` — minimal bundle starter

Use `default` when you want the smallest generated bundle and plan to wire your own routing, dependencies, Data SDK calls, and companion metadata:

```bash
sf template generate ui-bundle --name myApp --template default
```

## Full internal / external project templates

When `sf template generate project --help` lists `reactinternalapp` or `reactexternalapp`, use them when you want the CLI to generate the broader app scaffold instead of only a UI Bundle.

```bash
sf template generate project \
  --name GrantReviewCommandCenter \
  --template reactinternalapp \
  --api-version 67.0

sf template generate project \
  --name CommunityResilienceGrants \
  --template reactexternalapp \
  --api-version 67.0
```

The Community Resilience Grants demo used this project-template path, then moved/adapted the generated source into a single SFDX project containing one internal and one external app.

## External B2B / B2C portals

**Audience:** customers or partners signing in from outside the org.
**Target:** `Experience`.

External apps still need the Experience Cloud metadata stack, even when the initial React bundle came from `reactbasic` or `default`:

- Digital Experiences enabled in the org
- Customer/Partner Community user licenses
- A pre-wired Experience Cloud site with the app-container metadata below

### Required companion metadata for external apps

External apps **cannot ship as just a `UIBundle`**. You must also deploy:

```
force-app/main/default/
  digitalExperienceConfigs/         # Workspace settings (label, URL prefix, type)
  digitalExperiences/
    site/<SiteName>/
      sfdc_cms__site/<SiteName>/content.json
  networks/                         # The Experience Cloud site
  sites/                            # Salesforce site config
  uiBundles/myPortal/
```

### `digitalExperiences/.../sfdc_cms__site/.../content.json` — the critical wiring

Current generated external project templates wrap app-container fields in `contentBody`:

```json
{
  "type": "sfdc_cms__site",
  "title": "MyPortal",
  "contentBody": {
    "authenticationType": "AUTHENTICATED_WITH_PUBLIC_ACCESS_ENABLED",
    "appContainer": true,
    "appSpace": "c__myPortal"
  },
  "urlName": "myportal"
}
```

| Property | Rule |
|---|---|
| `contentBody.appContainer` | **Must be `true`** to flag the site as a React app container |
| `contentBody.appSpace` | **Must be `<NamespacePrefix>__<DeveloperName>`** — use `c__<DeveloperName>` if the org has no namespace |

> Unlike a standard LWR site, the React app's `digitalExperiences/` folder contains only the app-container CMS site content needed to host the bundle. Do not assume older single-folder examples match your installed template.

> The site **cannot be edited in Experience Builder**. Its role is to host the React bundle; app UI changes live in React source and `dist/`.

## Picking the right target after the fact

Switching `<target>` from `CustomApplication` to `Experience` (or vice versa) is **not a hot swap**. You'll need:

- Going internal → external: add the Experience metadata folders above and a real Experience Cloud site, then redeploy.
- Going external → internal: remove the dependent site metadata, add `applications/<AppName>.app-meta.xml`, and grant app access via `SetupEntityAccess`.

Plan the target up front whenever possible.

## Manual setup (no template)

If you're not using a template and writing the bundle by hand, install these helpers:

```bash
npm install --save-dev @salesforce/vite-plugin-ui-bundle
npm install @salesforce/ui-bundle @salesforce/platform-sdk
```

Minimum `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { uiBundle } from "@salesforce/vite-plugin-ui-bundle";

export default defineConfig({
  plugins: [react(), uiBundle()],
  build: { outDir: "dist", sourcemap: false }
});
```

Minimum `package.json` scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview"
  }
}
```

Prefer `tsc --noEmit && vite build` unless you intentionally configure TypeScript project references and forceignore emitted build artifacts. `tsc -b` can leave `vite.config.js`, declaration files, or `*.tsbuildinfo` in the deployable bundle root.

Add a starter `ui-bundle.json` (see [project-structure.md](project-structure.md)), `<app>.uibundle-meta.xml`, and the correct companion metadata (`applications/` for internal apps, Experience Cloud folders for external apps).
