# Official sources and research findings

Reviewed **October 8, 2026** for skill v3.0.0. Research read all **33 topics** in
the current Multi-Framework guide sidebar, related Microfrontend pages, current
Salesforce-authored recipe code, and npm package exports/declarations. This is a
maintained evidence index and audit rationale, not a copied manual. No org was
changed or app deployed during this documentation refresh.

## Source precedence and limits

Use current feature-specific guide pages for platform requirements, the target
org/release for availability, and installed package declarations for code APIs.
Recipe conventions and prior demo errors are local evidence, not global rules.
The old exact July 16 GA date had only generic blog links; this refresh does not
repeat it as a verified release claim. Older Beta blog/docs are historical context.

Atlas Metadata API/CLI HTML endpoints returned generic shells in this research
rather than readable topic content; their links remain useful but were not used
as independent validation. Current guide, package declarations, and recipe source
support the concrete changes. Live-org validation remains outside this task.

## Guide coverage and resulting decisions

| Current page | Audit rationale / skill impact |
|---|---|
| [Salesforce Multi-Framework Overview](https://developer.salesforce.com/docs/platform/multiframework/guide/multiframework-overview.html) | Framework-agnostic runtime; React/Angular, app-domain isolation and UI API governance. Replaces React-only and broad manual-security claims. |
| [Get Started](https://developer.salesforce.com/docs/platform/multiframework/guide/mfw-get-started.html) | Lifecycle route map; authoring tool is a choice. No mandatory optional-feature setup for ordinary edits. |
| [Set Up Your Org for Multi-Framework App Development](https://developer.salesforce.com/docs/platform/multiframework/guide/mfw-setup.html) | Eligible Hyperforce editions, excluded clouds, domain/Edge setup, ACC and CMS conditions. Removes all-editions, old toggle, and placeholder-site rules. |
| [Quick Start: Build and Run Your First App](https://developer.salesforce.com/docs/platform/multiframework/guide/mfw-quick-start.html) | Full internal project, app visibility assignment and launch. Fixes treating bundle-only generation as a complete app. |
| [Generate an App from a Template](https://developer.salesforce.com/docs/platform/multiframework/guide/mfw-generate-app.html) | Project versus bundle templates, both frameworks and audiences. Adds Angular; internal/external template names are current. |
| [Project Structure and Metadata](https://developer.salesforce.com/docs/platform/multiframework/guide/mfw-project-structure.html) | Integer schema version, qualified app reference, runtime API version and site metadata. Fixes semantic XML version and unsupported-apiVersion advice. |
| [Build with Agentic Coding Tools](https://developer.salesforce.com/docs/platform/multiframework/guide/mfw-agentic-tools.html) | Generated AGENT context, optional skill library/DX MCP; skill names evolve. Removes fixed unavailable skill/tool dependencies. |
| [Preview and Run Your App Locally](https://developer.salesforce.com/docs/platform/multiframework/guide/mfw-preview.html) | Framework dev scripts, SF_UIBUNDLE_PORT and VS Code Live Preview. Adds preview routing without requiring Vibes. |
| [Style Your Apps](https://developer.salesforce.com/docs/platform/multiframework/guide/mfw-styling.html) | React SLDS/DSR/shadcn options. Keeps styling choice local rather than mandatory shell architecture. |
| [Integrate Agentforce Conversation Client in Your React App](https://developer.salesforce.com/docs/platform/multiframework/guide/reactdev-acc.html) | Internal Employee Agent versus external Enhanced Chat v2; package mount example. Corrects unsupported ACC export/config/cleanup sketches. |
| [Access Data and Platform Capabilities](https://developer.salesforce.com/docs/platform/multiframework/guide/data-sdk-usage.html) | Data and platform capability index. Routes to extensions, identity, host UI, and localization instead of loading everything. |
| [Work with Data SDK](https://developer.salesforce.com/docs/platform/multiframework/guide/data-sdk-intro.html) | Current initialization/status APIs, query/mutate and support matrix. Fixes on401/on403, lowercase surface, and missing-capability assumptions. |
| [Access Salesforce APIs](https://developer.salesforce.com/docs/platform/multiframework/guide/data-sdk-connect.html) | Newer API-family support and audience differences. Replaces old exhaustive endpoint allowlist. |
| [GraphQL Query Parameters](https://developer.salesforce.com/docs/platform/multiframework/guide/data-sdk-query.html) | Query options, headers, reactive result and field envelopes. Adds initial-plus-subsequent snapshot handling. |
| [GraphQL Mutate Parameters](https://developer.salesforce.com/docs/platform/multiframework/guide/data-sdk-mutate.html) | Mutation options/results and partial outcomes. Preserves errors and separates operation success from presence of data. |
| [GraphQL Queries in Data SDK](https://developer.salesforce.com/docs/platform/multiframework/guide/data-sdk-graphql.html) | Org schema, inline gql/external operations and generated types. Corrects scalar/envelope handling and imports. |
| [GraphQL Mutations in Data SDK](https://developer.salesforce.com/docs/platform/multiframework/guide/data-sdk-graphql-mutation.html) | CRUD input nesting and fresh query reconciliation. Ordinary cached rereads do not guarantee freshness. |
| [Error Handling in Data SDK](https://developer.salesforce.com/docs/platform/multiframework/guide/data-sdk-graphql-error.html) | Partial responses, transport failures and stable error extensions. Cache misses branch on CACHE_MISS rather than catch. |
| [Cache Control in Data SDK](https://developer.salesforce.com/docs/platform/multiframework/guide/data-sdk-cache-control.html) | Cache partitions, header-aware keys, TTL and resolved miss behavior. Fixes thrown-miss and base-URL-only guidance. |
| [Per-Request Headers](https://developer.salesforce.com/docs/platform/multiframework/guide/data-sdk-request-headers.html) | Headers merge over defaults and influence cache reuse; trace IDs fragment cache. Avoid blanket GraphQL-localization promises. |
| [Data SDK Extensions](https://developer.salesforce.com/docs/platform/multiframework/guide/data-sdk-extension.html) | Extensions are opt-in runtime APIs, not LWC virtual imports. Adds discoverable capability route. |
| [Get Custom Labels with the Labels Extension](https://developer.salesforce.com/docs/platform/multiframework/guide/data-sdk-extension-label.html) | Labels extension minimum API 64, fallbacks and bounded batching. Distinguishes it from the newer i18n backend. |
| [Create a Data SDK Extension](https://developer.salesforce.com/docs/platform/multiframework/guide/data-sdk-extension-custom.html) | Typed extension setup, names/aliases, literal tuples and minApiVersion checks. Version checks do not imply surface support. |
| [Get App Identity](https://developer.salesforce.com/docs/platform/multiframework/guide/data-sdk-identity.html) | Optional ambient identity and qualified name. Local development may omit identity; client identity is not authorization. |
| [Manage the Host UI](https://developer.salesforce.com/docs/platform/multiframework/guide/data-sdk-view.html) | Optional host UI methods, shared instance and event/subscription cleanup. Adds View SDK and fallback decisions. |
| [Localize Your App](https://developer.salesforce.com/docs/platform/multiframework/guide/data-sdk-i18n.html) | I18n context/formatters/backend minimum API 68, cache reload and manifests. Removes localization-roadmap claim. |
| [Use Skills for Data Access](https://developer.salesforce.com/docs/platform/multiframework/guide/data-sdk-skills.html) | Current data-access/localization skills, with library naming caveat. Keeps this skill self-contained. |
| [Test, Deploy, and Distribute Your App](https://developer.salesforce.com/docs/platform/multiframework/guide/mfw-lifecycle.html) | Test/deploy/manage/distribute index. Separates optional packaging/embedding from ordinary deployment. |
| [Test Your App](https://developer.salesforce.com/docs/platform/multiframework/guide/mfw-testing.html) | React/Angular unit and static E2E workflows. Static local tests are not live-org evidence; coverage threshold stays a local convention. |
| [Deploy and Publish a UIBundle](https://developer.salesforce.com/docs/platform/multiframework/guide/mfw-deploy.html) | Build assets, optional runtime API version, integer version/isActive and companion dependency resolution. Removes one-bundle universal rule. |
| [Manage Your App and Grant User Access](https://developer.salesforce.com/docs/platform/multiframework/guide/mfw-manage.html) | App Manager and separate visibility/API/data grants. Removes App Manager roadmap and mandatory anonymous-Apex access insertion. |
| [Embed Your App in Salesforce with Microfrontends (Beta)](https://developer.salesforce.com/docs/platform/multiframework/guide/mfw-ui-embedding.html) | Internal UIBundle embedding explicitly Beta. Adds supported wrapper and actual launch URL workflow. |
| [Package Your App for Distribution](https://developer.salesforce.com/docs/platform/multiframework/guide/mfw-packaging.html) | Internal React/Angular unlocked/managed 2GP, source API 67+, review maps/analyzer and upgrade activation. External app packaging unsupported. |

## Feature-specific status and discrepancies

- **Embedding scope:** [UI Embedding](https://developer.salesforce.com/docs/platform/microfrontend/guide)
  calls the external host-component path GA. [Internally hosted bundles](https://developer.salesforce.com/docs/platform/microfrontend/guide/internal-ui-bundles.html)
  remain Beta, with React-only, explicit URL, no dynamic resolution/packaging,
  and manual CSP limitations. General Angular app hosting does not override those.
- **Preview code:** [UI Embedding Recipes](https://developer.salesforce.com/docs/platform/microfrontend/guide/recipes.html)
  explicitly calls the recipes Developer Preview. Prefer the current host component
  and [data-exchange contract](https://developer.salesforce.com/docs/platform/microfrontend/guide/exchange-data.html).
- **ACC:** the integration page's prose names createAccWidget, but its sample and
  published 12.11.0 exports use embedAgentforceClient. The verified implementation
  requires salesforceOrigin or frontdoorUrl; modes are inline/floating and there
  is no destroy handle. Follow declarations rather than copying the prose blindly.
- **Language/API:** the standalone setup page no longer states a universal
  en_US requirement; UI Embedding still does. Labels extension says API 64+;
  i18n runtime/backend says 68+. Keep these separate, not a global language claim.
- **Transport:** Data SDK intro's short endpoint list is narrower than Access
  Salesforce APIs. Use the newer audience-specific family table. The headers page
  mentions Accept-Language for REST/GraphQL while the intro says GraphQL response
  localization is unsupported; avoid claiming universal server localization.
- **Recipes drift:** upstream AGENT.md retains Beta imports, scratch uncertainty,
  and one-bundle guidance. Current source/lockfiles and guide take precedence for
  API/metadata; educational inline-query conventions remain useful.

## Reference code and package snapshot

[Multi-Framework Recipes](https://github.com/trailheadapps/multiframework-recipes)
was downloaded from its main branch for source inspection. React recipe package
version was 1.59.0, with Salesforce packages declared ^12.3.3; this is a branch
snapshot, not a dependency recommendation.

- [React source](https://github.com/trailheadapps/multiframework-recipes/tree/main/force-app/main/react-recipes):
  qualified app reference, integer version, default Vite plugin, runtime basename.
- [Angular source](https://github.com/trailheadapps/multiframework-recipes/tree/main/force-app/main/angular-recipes):
  custom esbuild/middleware integration, flat dist output, Angular test/dev scripts.
- [Agent context](https://github.com/trailheadapps/multiframework-recipes/blob/main/AGENT.md):
  recipe conventions with the stale sections noted above.

Published npm latest metadata and tarball declarations were inspected for all
three packages at **12.11.0** (point-in-time observation, not a permanent pin):

| Package | Verified detail |
|---|---|
| [platform-sdk](https://www.npmjs.com/package/@salesforce/platform-sdk) | /data, /data/extensions, /view, /i18n, /ui-embedding and root identity exports; onStatus, error extensions and typed extensions |
| [agentforce-conversation-client](https://www.npmjs.com/package/@salesforce/agentforce-conversation-client) | embedAgentforceClient, nested config, authenticated options, inline/floating, bridge/session handle |
| [vite-plugin-ui-bundle](https://www.npmjs.com/package/@salesforce/vite-plugin-ui-bundle) | Default plugin function; Vite ^7 peer requirement |

## Further primary references

- [Metadata API UIBundle](https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/meta_uibundle.htm)
- [CLI ui-bundle generation](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/cli_reference_template_generate_ui-bundle.htm)
- [CLI project generation](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/cli_reference_template_generate_project.htm)
- [Salesforce skills library](https://github.com/forcedotcom/sf-skills) (names change; inspect the available library)
- [Standalone ACC SDK](https://developer.salesforce.com/docs/platform/accsdk/overview)
- [Enhanced Chat v2](https://help.salesforce.com/s/articleView?id=service.enhanced_chat_v2_intro.htm&type=5)

For an API bug, check installed types and the current page linked here. For an
org-specific limitation, reproduce on the intended release/user. Record the
verification date and unresolved discrepancies instead of silently encoding old
observations as platform-wide restrictions.

## Skill verification

The skill-creator validator passes. The revised TypeScript starter assets, Vite
configuration, and labels/i18n/identity/View SDK snippets typecheck against the
inspected 12.11.0 declarations. Seventeen isolated tests cover request states,
partial errors, SDK initialization retry, and ACC readiness/reconfiguration/
cleanup. Template XML/JSON parse and all 121 local Markdown links resolve.
An independent forward test exercised an API 67 Angular portal and an embedded
React app with caching, packaging, and Employee Agent requirements; its supporting
reference inconsistencies were corrected. These checks do not establish live-org
availability, authorization, rendering, deployment, or session behavior.
