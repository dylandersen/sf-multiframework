# Build, deploy, and manage

Reviewed 2026-10-08 against [Deploy and Publish](https://developer.salesforce.com/docs/platform/multiframework/guide/mfw-deploy.html),
[Manage and Grant Access](https://developer.salesforce.com/docs/platform/multiframework/guide/mfw-manage.html),
and current recipe builds.

## Build the actual payload

Run the existing npm install/CI, lint, relevant tests, and build from the bundle.
React templates use Vite; Angular uses its generated Angular/esbuild pipeline.
Honor intentional TypeScript project references (`tsc -b` is not inherently
wrong); prevent unwanted compiler/test/cache artifacts from entering deployment.
The generated `outputDir` must contain `index.html` and its referenced assets.

The limit is **up to 2,500 files** per bundle. Count the build payload and inspect
what Salesforce DX includes. Sourcemaps may be omitted for ordinary non-review
builds, but managed AppExchange submission needs them. See [packaging.md](packaging.md).

```bash
rg --files --hidden --no-ignore dist | wc -l
```

Use the project's `.forceignore` for node_modules, coverage, Playwright output,
and caches. Do not ignore the entire deployable build directory. Avoid broad
ignore rules that drop backend tests or unrelated metadata from the requested release.

## Metadata, API version, and activation

Bundle XML has `isActive` plus integer schema `version` (normally 1), not
`isEnabled`, an XML API version, or semantic app versioning. Internal apps need
CustomApplication metadata with the qualified bundle reference; external apps
need DigitalExperience, DigitalExperienceConfig, Network, and CustomSite.

DX `sourceApiVersion` uses `67.0` or later for current internal app metadata and
packaging. Runtime `ui-bundle.json.apiVersion` is supported, uses **`vXX.X`**, and
should match the target org; omitting it uses the org's current version. If a
particular validator rejects it, verify the installed tooling/org release and
capture the error. Do not turn an old validator failure into a universal prohibition.
SDK `webapp.apiVersion` uses `XX.X`, independently of the runtime file's `v` prefix.

## Deployment scope

Build first, then deploy bundle plus dependencies in one transaction. The guide
explicitly supports whole-project `force-app` deployment with DX dependency
resolution and no special type order. For a targeted internal app:

```bash
sf project deploy start \
  --source-dir force-app/main/default/uiBundles/MyApp \
  --source-dir force-app/main/default/applications/MyApp.app-meta.xml \
  --source-dir force-app/main/default/permissionsets/MyApp_Access.permissionset-meta.xml \
  --target-org TARGET_ORG --json
```

Adapt to actual names. Include Apex/object dependencies when changed or missing.
Multiple bundle projects are supported by current recipes; build every bundle in
scope. Single-bundle deploys are useful to isolate an observed conflict, not a
platform-wide rule. Inspect source-tracking differences before using
`--ignore-conflicts`; don't overwrite remote changes just because a deploy failed.

Use CLI or available Salesforce DX MCP tools according to the user's environment.
Discover MCP schemas; no hardcoded tool identifier is required by the platform.
Metadata deploy/publish, permission assignment, package creation, and seed imports
are separate side effects whose scope follows the task.

## Scratch orgs and CI

Current recipes use scratch orgs with an ordinary Developer/en_US definition and
without the legacy `UiBundleSettings/webAppOptIn` block. Treat that as the current
example, not proof that every org automatically satisfies app-domain/Edge settings.
Check [setup.md](setup.md) if a feature gate fails. Do not diagnose every missing
feature as an old release or delete unrelated scratch settings mechanically.

CI should install from the lockfile, run bundle-specific lint/tests/build, then
validate/deploy the requested source. Generate schema/types if the project's
pipeline needs them. Use the CI platform's secret mechanisms for CLI/MCP auth;
never place credentials in the repo or print full `sf org display --verbose`
output. Follow the project's existing pipeline rather than adding a deployment
job merely because the app uses UIBundle.

## App Manager and deployed verification

App Manager lists internal and external apps with Type **Multi-Framework**.
Internal app details support label/description edits; structural changes remain
source-managed. External apps are managed through their site and have no App
Details page. Both can appear in App Launcher; external entries open the site URL.

Deploy the access permission set, assign it, and verify API Enabled plus the
intended user's CRUD/FLS/sharing. Launch the internal app from App Launcher and
use the real `salesforce.app` URL. Verify deep-route refresh, data rendering, and
write/readback behavior. For external apps, verify public/authenticated routes
and site publication as required by that site; don't infer success from a
publish command's backing-site URL alone.

A clean local build or mocked static E2E suite does not establish deployed-org
sessions, permissions, CSP, or data freshness. Report those limits explicitly.
