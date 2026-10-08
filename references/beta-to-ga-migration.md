# Migrate an older Multi-Framework app

Use this only for an app that still carries Beta APIs/metadata. The current
[Data SDK](https://developer.salesforce.com/docs/platform/multiframework/guide/data-sdk-intro.html)
and [project structure](https://developer.salesforce.com/docs/platform/multiframework/guide/mfw-project-structure.html)
were reviewed on 2026-10-08; this is a migration checklist, not a universal release
history or permission to delete/recreate an app.

## SDK calls

Install `@salesforce/platform-sdk`, remove the old SDK dependency when no longer
used, and import data APIs from `/data`:

```diff
- import { createDataSDK, gql } from "@salesforce/sdk-data";
+ import { createDataSDK, gql } from "@salesforce/platform-sdk/data";
- const result = await sdk.graphql?.({ query: QUERY, variables });
+ const result = await sdk.graphql?.query({ query: QUERY, variables });
- const write = await sdk.graphql?.({ query: MUTATION, variables });
+ const write = await sdk.graphql?.mutate({ mutation: MUTATION, variables });
```

Guard absent SDK capabilities and `result.data`, and preserve usable partial
responses with explicit error policy. Replace `webapp.on401/on403` with
`webapp.onStatus: { 401: ..., 403: ... }`; normally omit surface overrides.
Add query refresh after writes and subscription cleanup where relevant.
A cache-only miss now resolves an error with `extensions.code === "CACHE_MISS"`.

Check existing GraphQL against the target org schema rather than promising every
old query is unchanged. Regenerate types and update mocks to query/mutate objects.
Use the plugin default export `salesforce()` in Vite, not an invented named
`uiBundle` import. Inspect peer dependencies before upgrading its Vite major.

## Internal metadata and launch

Replace an old `AppLauncher` target with `CustomApplication`, using source API
67.0+ for current internal metadata. XML uses `isActive` and `<version>1</version>`;
version is an integer schema version. Add the CustomApplication qualified
`uiBundle` reference, then deploy and assign access visibility plus API Enabled.
See [project-structure.md](project-structure.md), [permissions-csp.md](permissions-csp.md).

Launch via App Launcher and copy its actual `salesforce.app` URL. Old
`/lwr/application/ai/` demo links are not the current launch contract. Include
Apex/object dependencies when moving to a new org. Keep external `Experience`
site dependencies when migrating an external app.

Current scratch recipes omit the old `UiBundleSettings/webAppOptIn` block. Inspect
the target org/template before removing legacy settings; don't extrapolate that
all eligible orgs have app-domain and Edge configuration enabled.

## Optional features

- ACC: migrate unsupported `createAccWidget`/flat branding/destroy sketches to
  installed `embedAgentforceClient` declarations and authenticated embedding
  configuration. External Service Agent apps use Enhanced Chat v2.
- Localization: labels extension minimum API 64; i18n runtime/backend minimum 68.
- Packaging: internal React/Angular 2GP is documented; retain review sourcemaps.
- Embedding: migrate preview host APIs using the current Microfrontend guide;
  internal UIBundle embedding remains Beta with narrower restrictions.

## Verify without destructive reset

Build/lint and relevant tests, deploy within scope, assign the intended grants,
and verify launch/data/deep routes. If source tracking conflicts, inspect the
remote difference before choosing a resolution. A stale tile or old demo error
does not justify automatically deleting source or the associated site.
