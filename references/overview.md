# Overview and release scope

Reviewed 2026-10-08. [Salesforce's overview](https://developer.salesforce.com/docs/platform/multiframework/guide)
describes a framework-agnostic runtime with ready-to-use React and Angular
projects. Apps run as self-contained `UIBundle` metadata in a DX project, using
Salesforce hosting, authentication, and supported platform APIs.

| Surface | Hosting and entry point | Required companion metadata |
|---|---|---|
| Internal B2E app | Own origin under `*.salesforce.app`; App Launcher and Salesforce mobile | CustomApplication referencing `c__bundleName` (or registered namespace) |
| External B2B/B2C app | Experience Cloud site; public or authenticated site URL; also listed in App Launcher | DigitalExperience, DigitalExperienceConfig, Network, CustomSite |
| Embedded internal bundle | Standalone app URL in a `lightning-ui-embedding` LWC wrapper | Working internal app plus wrapper and host page configuration |

A bundle can contain up to 2,500 files. `isActive` controls serving; XML `version`
is an integer schema version, not npm/app semantic versioning. The target enables
a container to reference the bundle; it does not create that container itself.

## Availability and capability boundaries

- Hosting: eligible editions on Hyperforce, excluding Alibaba/Government Cloud;
  internal hosting requires app domain and Edge Network. See [setup.md](setup.md).
- React and Angular app templates, App Manager, and internal managed/unlocked 2GP
  packaging are documented capabilities. Do not leave them in a roadmap list.
- External app packaging is unsupported. Experience app-container sites cannot
  be edited in Experience Builder; edit framework source and site metadata.
- Localization is documented: labels extension minimum API 64.0; the separate
  i18n runtime and backend minimum API 68.0. See [platform-capabilities.md](platform-capabilities.md).
- Externally hosted UI Embedding is described as GA in its guide. **Embedding
  internally hosted UIBundles remains Beta** and its specific page currently
  limits this path to React. General Angular hosting support does not lift that
  embedding limitation. See [microfrontends.md](microfrontends.md).
- Builder Central is Beta and offers a guided React authoring experience;
  Agentforce Vibes and other coding tools are optional authoring choices.

The old skill's exact GA announcement date and universal org/language claims
were not substantiated by the current guide. Use feature-specific evidence,
org settings, and installed package versions instead of extrapolating one status
to every SDK or distribution surface.

## Security and framework choice

The app origin is isolated from Lightning DOM, storage, and session cookies.
Supported UI API operations enforce object/field access, sharing, and validation;
SDK transport manages auth/CSRF. Custom Apex REST needs its own permission checks.
Embedding adds a controlled bridge rather than direct parent DOM access.

Choose LWC for reusable native platform components and Lightning services.
Choose React or Angular for a custom SPA, portal, or reuse of framework expertise.
See [lwc-vs-react.md](lwc-vs-react.md). Standard npm packages and documented SDK
entry points are supported; LWC virtual modules and `@wire` are not.
