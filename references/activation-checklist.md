# Activation and readiness checklist

Use this for a new app or deployment review; ordinary component edits only need
the relevant checks. [Current setup](https://developer.salesforce.com/docs/platform/multiframework/guide/mfw-setup.html),
[metadata](https://developer.salesforce.com/docs/platform/multiframework/guide/mfw-project-structure.html),
and [access](https://developer.salesforce.com/docs/platform/multiframework/guide/mfw-manage.html)
were reviewed on 2026-10-08.

- Confirm an eligible edition on Hyperforce and the intended authorized org.
- For internal apps, confirm Salesforce app domain and Edge Network.
- Check generated Node requirements, CLI/plugin help, and the bundle lockfile.
- Locate the actual DX package directory; `force-app/main/default` is a template
  convention, while recipes have separate React/Angular package directories.
- Confirm `ui-bundle.json`, bundle XML, integer `version`, and built `outputDir`.
  Optional runtime `apiVersion` uses `vXX.X`; DX `sourceApiVersion` uses `XX.X`.
  Internal metadata/packaging baseline is API 67.0+; i18n runtime needs 68.0+.
- Internal: `target: CustomApplication`, qualified CustomApplication `uiBundle`
  reference, app visibility and API Enabled grants, and permission-set assignment.
- External: `target: Experience`, all four companion site metadata types, Digital
  Experiences, appropriate licenses, and `appContainer`/qualified `appSpace`.
- SPA: `index.html` fallback and a router basename matching the runtime mount.
- Data: Data SDK query/mutate split, guarded capabilities, schema-validated fields,
  explicit errors/empty states, relevant query refresh after writes.
- Security: object/FLS/sharing grants as the actual user; custom Apex independently
  enforces access. Avoid broad guest access to solve a frontend symptom.
- ACC only: Employee Agent, Agentforce enabled, cookie policy, Lightning Out origin
  trust, `embedAgentforceClient`, and cleanup.
- Embedding only: standalone app first, full launch URL, current host component,
  UIEmbedding/CSP configuration and feature status in [microfrontends.md](microfrontends.md).
- Packaging only: internal app, source API 67+, package dependencies, and managed
  review sourcemaps/analyzer requirements in [packaging.md](packaging.md).
- Run existing build/lint and task-relevant checks; count files (limit 2,500).
- Deploy bundle with companion metadata within the authorized scope. Do not
  impose one bundle per transaction as a universal platform restriction.
- Launch as the intended user and verify data, writes, and hard-refresh routes.
  Report local-only verification separately from deployed-org verification.
