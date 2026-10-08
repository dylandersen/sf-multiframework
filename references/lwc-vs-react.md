# Multi-Framework versus LWC

Reviewed 2026-10-08 against [Salesforce's overview and framework comparison](https://developer.salesforce.com/docs/platform/multiframework/guide).
Multi-Framework broadens framework choice; preserve working LWC components unless
the requested app benefits from a different framework.

| Need | Useful choice | Why |
|---|---|---|
| Reusable record-page tile, Flow screen, native Lightning services | LWC | Native composition, base components, LDS, navigation, `@wire` |
| Self-contained employee SPA or custom portal | React or Angular UIBundle | Existing framework expertise and npm UI ecosystem with platform hosting |
| Existing web app embedded on a Salesforce page | UI Embedding wrapper | Reuse the app through the supported iframe bridge |
| Internal bundle embedded on a page | React UIBundle + LWC wrapper (Beta scope) | Supported explicit app URL path; verify current limitations |
| Employee Agent chat in a React app | ACC | Prebuilt conversational UI and Lightning Type rendering |

Multi-Framework UI API data requests inherit CRUD/FLS/sharing and validation.
The app origin is isolated from Lightning; custom Apex still needs its own
security. Do not imply React/Angular must reimplement all UI API access control.
Performance depends on API design, payloads, caching, and UI workload; don't
promise a framework alone is faster.

LWC modules and virtual imports do not work inside an ordinary React/Angular app.
A supported LWCI integration such as ACC is a separate mechanism, not a generic
permission to import arbitrary Lightning components into JSX.

React apps **can** be embedded through `lightning-ui-embedding` in an LWC wrapper;
the internal bundle path is Beta while external URL embedding is documented GA.
Angular is supported for standalone internal/external apps; the narrower internal
embedding page still limits that path to React. See [microfrontends.md](microfrontends.md).
Salesforce mobile can launch internal Multi-Framework apps; choose LWC when the
requirement is native reusable mobile components rather than a custom web app.

App Manager, internal managed/unlocked packaging, and localization now have
current guide pages. Check org eligibility and each feature's API/runtime minimum
instead of using the old all-editions/English-only/roadmap claims. See
[overview.md](overview.md), [setup.md](setup.md), and [platform-capabilities.md](platform-capabilities.md).
