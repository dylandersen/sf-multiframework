# CLI and preview workflow

Primary references: [templates](https://developer.salesforce.com/docs/platform/multiframework/guide/mfw-generate-app.html),
[preview](https://developer.salesforce.com/docs/platform/multiframework/guide/mfw-preview.html),
[deployment](https://developer.salesforce.com/docs/platform/multiframework/guide/mfw-deploy.html).
Reviewed 2026-10-08. Use installed `--help` for exact flags.

```bash
sf plugins install @salesforce/plugin-ui-bundle-dev
sf template generate project --help
sf template generate ui-bundle --help
```

Use full project templates for internal/external apps; bundle templates for an
existing DX project. See [templates.md](templates.md) for React and Angular names.

## Develop in the bundle

```bash
cd force-app/main/default/uiBundles/MyApp
npm install
npm run graphql:schema
npm run graphql:codegen
npm run dev
```

The schema/codegen commands depend on the generated project's scripts; inspect
`package.json`. Schema retrieval needs an authorized org. Do not run a missing
script or assume every Angular project has the React codegen setup.

`npm run dev` is the standard template entry point for both frameworks. The
preview guide also documents `npx ng serve` for Angular. Preserve the generated
middleware/proxy path for real data. Set `SF_UIBUNDLE_PORT=4200 npm run dev` to
choose another port. ACC needs that exact local origin trusted as Lightning Out.

Live Preview in VS Code uses **SFDX: Open in Live Preview**, with the Extension
Pack, UI Bundle plugin, and an authorized org. It works without requiring Vibes.

## Build and deploy

Run the app's build script inside its bundle and confirm the `outputDir` assets.
From the DX project root, a fresh internal app can deploy as follows:

```bash
sf project deploy start \
  --source-dir force-app/main/default/uiBundles/MyApp \
  --source-dir force-app/main/default/applications/MyApp.app-meta.xml \
  --source-dir force-app/main/default/permissionsets/MyApp_Access.permissionset-meta.xml \
  --target-org TARGET_ORG
sf org assign permset --name MyApp_Access --target-org TARGET_ORG
sf org open --target-org TARGET_ORG
```

Adapt paths/names to actual generated files. External apps need the four site
metadata types; Apex-backed apps need their backend dependencies. Deploying all
`force-app` is appropriate when the entire project is in scope. There is no
special dependency order in the current guide. Scope deploys to the user's work;
one bundle at a time is a troubleshooting option, not a documented universal cap.

Salesforce DX MCP is an equivalent authoring path when configured. Discover its
actual tools and schemas; don't paste stale hardcoded `mcp_Salesforce_DX_*` calls.
See [authoring-surface.md](authoring-surface.md).

For API/config, publication, tests, and failure diagnosis, read
[project-structure.md](project-structure.md), [ci-deploy.md](ci-deploy.md), and
[troubleshooting.md](troubleshooting.md). Sample record imports and site publishing
are separate operations; perform them only when included in the task.
