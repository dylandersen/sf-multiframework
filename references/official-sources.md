# Official Sources

The authoritative documentation and reference implementations this skill is distilled from. Cite these when you need to back up a claim or check the current state of the feature.

## Salesforce Developer Documentation

> Note: Multi-Framework became generally available on July 16, 2026 (Summer '26 release baseline). Some linked pages below may still be titled "(Beta)" until the docs are refreshed — the link text mirrors the current page titles. The Beta blog references `@salesforce/sdk-data`; at GA you install `@salesforce/platform-sdk` and import from the `@salesforce/platform-sdk/data` subpath.

### GA landing (start here)
- [Salesforce Multi-Framework Developer Guide (GA)](https://developer.salesforce.com/docs/platform/multiframework/guide) — setup guide, API reference, and best practices
- [Build with React on Salesforce: Multi-Framework Is Now GA](https://developer.salesforce.com/blogs/) — GA announcement (July 16, 2026): package rename, `salesforce.app` domain, `.query()`/`.mutate()` split, `CustomApplication` target, and the five migration steps
- [Introducing Salesforce Multi-Framework](https://developer.salesforce.com/blogs/) — original Beta announcement (April 15, 2026) with a detailed walkthrough

### Overview & Setup
- [Build a React App with Salesforce Multi-Framework (Beta)](https://developer.salesforce.com/docs/platform/einstein-for-devs/guide/reactdev-overview.html)
- [Configure Your Org for React App Development (Beta)](https://developer.salesforce.com/docs/platform/einstein-for-devs/guide/reactdev-setup.html)

### Project Mechanics
- [Integrate Your React App with the Agentforce 360 Platform (Beta)](https://developer.salesforce.com/docs/platform/code-builder/guide/reactdev-integrate.html) — `UIBundle`, `ui-bundle.json`, `.uibundle-meta.xml`, templates
- [Develop a React App Manually (Beta)](https://developer.salesforce.com/docs/platform/einstein-for-devs/guide/reactdev-develop.html) — manual authoring path

### Data SDK & GraphQL (GA `/multiframework/guide/`)
- [Work with Data SDK](https://developer.salesforce.com/docs/platform/multiframework/guide/reactdev-data-sdk.html) — `@salesforce/platform-sdk/data`, `createDataSDK`, `DataSDK`/`DataSDKGraphQL` interfaces
- [GraphQL Queries in Data SDK](https://developer.salesforce.com/docs/platform/multiframework/guide/reactdev-data-sdk-graphql.html)
- [GraphQL Query Parameters](https://developer.salesforce.com/docs/platform/multiframework/guide/reactdev-data-sdk-query.html) — `QueryOptions`, `QueryResult`, `subscribe`/`refresh`
- [GraphQL Mutate Parameters](https://developer.salesforce.com/docs/platform/multiframework/guide/reactdev-data-sdk-mutate.html) — `MutateOptions`, `MutationResult`
- [GraphQL Mutations in Data SDK](https://developer.salesforce.com/docs/platform/multiframework/guide/reactdev-data-sdk-graphql-mutation.html)
- [Cache Control in Data SDK](https://developer.salesforce.com/docs/platform/multiframework/guide/reactdev-data-sdk-cache-control.html) — `CacheControl`, shared GraphQL cache
- [Error Handling in Data SDK](https://developer.salesforce.com/docs/platform/multiframework/guide/reactdev-data-sdk-graphql-error.html) — `GraphQLError`, partial success

### UI / Experience
- [Style Your React Apps (Beta)](https://developer.salesforce.com/docs/platform/code-builder/guide/reactdev-styling.html)
- [Integrate Agentforce Conversation Client in Your React App (Beta)](https://developer.salesforce.com/docs/platform/einstein-for-devs/guide/reactdev-acc.html)

### Decisions
- [React vs LWC (Beta)](https://developer.salesforce.com/docs/platform/code-builder/guide/reactdev-lwc-diff.html)

## Reference Implementations

### `multiframework-recipes`
- [GitHub: trailheadapps/multiframework-recipes](https://github.com/trailheadapps/multiframework-recipes) — canonical recipe set
- [`AGENT.md`](https://raw.githubusercontent.com/trailheadapps/multiframework-recipes/main/AGENT.md) — developer & agent guide for the recipe repo (the source of most recipe conventions in this skill)
- Key directories:
  - `force-app/main/react-recipes/uiBundles/reactRecipes/` — the React app
  - `force-app/main/default/` — shared metadata (objects, classes, permission sets)
  - `data/` — sample data tree plans

## Salesforce CLI Reference

- [Salesforce CLI Command Reference: ui-bundle Commands](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/cli_reference_ui-bundle.htm)
- [Salesforce CLI Command Reference: template generate ui-bundle](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/cli_reference_template_generate_ui-bundle.htm)
- [Salesforce CLI Command Reference: template generate project](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/cli_reference_template_generate_project.htm)

## Metadata API

- [Metadata API Developer Guide: UIBundle](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_uibundle.htm)
- [Salesforce DX Project Structure and Source Format](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_source_file_format.htm)

## Related Salesforce Docs

- [Lightning Types in Agent Action](https://developer.salesforce.com/docs/) — used by ACC for dynamic component rendering
- [Agentforce Conversation Client Developer Guide](https://developer.salesforce.com/docs/) — standalone (external apps)
- [Agentforce Vibes Setup](https://developer.salesforce.com/docs/platform/einstein-for-devs/guide/) — for AI-assisted authoring
- [Salesforce Multi-Framework Developer Guide](https://developer.salesforce.com/docs/) — landing page

## npm Packages

| Package | Purpose |
|---|---|
| [`@salesforce/platform-sdk`](https://www.npmjs.com/package/@salesforce/platform-sdk) | Data SDK (`createDataSDK`, `gql`, `NodeOfConnection`) — GA package name (Beta shipped as `@salesforce/sdk-data`) |
| [`@salesforce/agentforce-conversation-client`](https://www.npmjs.com/package/@salesforce/agentforce-conversation-client) | ACC widget for embedding chat |
| [`@salesforce/vite-plugin-ui-bundle`](https://www.npmjs.com/package/@salesforce/vite-plugin-ui-bundle) | Vite dev server integration |
| [`@salesforce/ui-bundle`](https://www.npmjs.com/package/@salesforce/ui-bundle) | Helper functions for the SDK |
| [`@salesforce-ux/design-system`](https://www.npmjs.com/package/@salesforce-ux/design-system) | SLDS CSS blueprints |
| [`@salesforce/design-system-react`](https://www.npmjs.com/package/@salesforce/design-system-react) | SLDS React components |

## When to defer to official docs

This skill condenses the docs and adds opinionated patterns from the recipe repo. Defer to the linked official sources when:

- A new release changes the API surface (versions of `@salesforce/platform-sdk`, ACC, the Vite plugin)
- You hit a specific error message you can't find in [troubleshooting.md](troubleshooting.md)
- The exact SDK option shape (e.g. `createAccWidget` parameters) matters for the bug you're fixing
- You need to verify a limitation hasn't changed (English-only, can't disable, etc.)

The skill's posture is: **patterns and decision frameworks** are stable enough to encode here; **exact API shapes** of evolving SDKs should be verified against the installed package.
