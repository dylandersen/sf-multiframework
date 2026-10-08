# Package and distribute a UIBundle

Reviewed 2026-10-08 against [Package Your App for Distribution](https://developer.salesforce.com/docs/platform/multiframework/guide/mfw-packaging.html).

Internal B2E React and Angular apps can use **second-generation unlocked or
managed packages**. External B2B/B2C app packaging is unsupported. This is separate
from Beta internal-embedding packaging limitations; don't merge the two scopes.

Use unlocked packages for internal distribution/iteration; managed packages for
customer distribution or AppExchange. Follow the team's packaging setup and the
current 2GP guide; ordinary UI work does not require a package workflow.

## Package contents

- Dev Hub with 2GP enabled; registered namespace for managed packages.
- Top-level DX `sourceApiVersion: "67.0"` or later. i18n features may need 68+.
- Bundle and its companion CustomApplication, plus relevant dependent metadata.
  Include the generated access permission set when useful to subscribers.
- Build current assets before package-version creation. Use the local dev server
  for iteration rather than repeated package-create/install round trips.

## Managed AppExchange review

The guide requires these extra steps for managed AppExchange submission; unlocked
packages do not undergo that review:

1. Emit production sourcemaps. For Vite use `build.sourcemap: true`.
2. Every built `.js` must have a co-located `.js.map`; each map's `sources[]`
   entries must use relative paths rather than local machine absolute paths.
3. Use Salesforce Code Analyzer plugin **5.16.0+**, after building:

```bash
sf code-analyzer run \
  --rule-selector uibundle \
  --rule-selector Recommended \
  --output-file CodeAnalyzerReport.html
```

The selectors add UIBundle checks and the recommended baseline. Preserve required
maps when reducing the 2,500-file payload; remove unused assets/caches first.
Check the generated Angular build's map layout too. A good local lint score is
not evidence of AppExchange approval.

## Subscriber verification and upgrades

The documented Tooling API check is:

```bash
sf data query --use-tooling-api --target-org SUBSCRIBER \
  --query "SELECT Id, DeveloperName, IsActive, ManageableState, NamespacePrefix FROM UIBundle"
```

Managed installations report `installed` with the package namespace; unlocked
installations report `installedEditable`. Verify `IsActive` and launch the app
as an intended subscriber user after access assignment. Package installation
alone does not prove UI, data access, or authentication.

Upgrades do not overwrite `IsActive`; the guide requires manual activation of
the new version after an upgrade. Follow the target org's supported activation
workflow, then verify serving. Do not increment XML `version` as a semantic
release counter; it is the bundle schema version.
