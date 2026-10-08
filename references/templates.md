# Templates and app containers

Reviewed against [Generate an App from a Template](https://developer.salesforce.com/docs/platform/multiframework/guide/mfw-generate-app.html)
on 2026-10-08. Confirm installed CLI help when names or flags differ.

| Purpose | Command | React template | Angular template |
|---|---|---|---|
| Full internal DX project | `sf template generate project` | `reactinternalapp` | `angularinternalapp` |
| Full external DX project | `sf template generate project` | `reactexternalapp` | `angularexternalapp` |
| Bundle in existing DX project | `sf template generate ui-bundle` | `reactbasic` | `angularbasic` |

```bash
sf template generate project --name MyApp --template reactinternalapp
sf template generate project --name MyPortal --template angularexternalapp
# Alternatively, from an existing DX project:
sf template generate ui-bundle --name myApp --template reactbasic
```

Full project templates supply companion app/site metadata. Bundle-only templates
supply the bundle; do not promise an access permission set, ACC, or a full site
from `reactbasic`. The generic `default` template may be listed by the installed
CLI but is not the guide's preferred framework starter.

Install npm dependencies inside the generated bundle, and retain its toolchain:
Vite integration for React; `angular.json`, esbuild integration, and middleware
for Angular. Read [angular.md](angular.md) for Angular-specific work.

## Internal apps

The bundle target is `CustomApplication` (also the default if omitted). Add a
CustomApplication with a qualified reference:

```xml
<CustomApplication xmlns="http://soap.sforce.com/2006/04/metadata">
    <formFactors>Large</formFactors>
    <label>My App</label>
    <navType>Standard</navType>
    <uiBundle>c__myApp</uiBundle>
    <uiType>Lightning</uiType>
</CustomApplication>
```

Use the generated app metadata for mobile form factors. Full internal templates
provide an access permission set for visibility and API Enabled. Deploy and
assign it; then grant the data permissions the app actually needs. See
[permissions-csp.md](permissions-csp.md).

## External apps

An `Experience` bundle needs `digitalExperienceConfigs/`, `digitalExperiences/`,
`networks/`, and `sites/`. Preserve the generated nesting and authentication type.
Within the CMS site `content.json`, the app-container wiring is:

```json
{
  "contentBody": {
    "appContainer": true,
    "appSpace": "c__myPortal"
  }
}
```

This is a fragment, not a replacement for the generated file. `appSpace` uses
`NamespacePrefix__DeveloperName`; the default namespace is `c`. The site's
public/authenticated access and licenses are separate from internal app access.
It also appears in App Launcher, opening its site URL.

You cannot edit this app-container site in Experience Builder. That restriction
does not prohibit placing an embedding wrapper on a separate Experience page.
See [experience-cloud-runbook.md](experience-cloud-runbook.md) for optional custom
login/Apex workflows; these are application patterns, not mandatory template steps.

Changing audience requires new companion metadata and access configuration.
Do not automatically delete the old site or app when changing the bundle target.

## Manual React configuration

Prefer generated tooling; for a hand-built app use the plugin's default export:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import salesforce from "@salesforce/vite-plugin-ui-bundle";

export default defineConfig({
  base: "./",
  plugins: [react(), salesforce()],
  build: { outDir: "dist" }
});
```

Published plugin 12.11.0 declares Vite `^7.0.0` as a peer (research snapshot,
not a permanent pin). Check package peers before upgrading bundlers. Keep
sourcemaps enabled for managed AppExchange review. See [packaging.md](packaging.md).
