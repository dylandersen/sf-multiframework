# sf-multiframework

Salesforce Multi-Framework skill by Dylan Andersen · **v3.0.0** · researched
**October 8, 2026**.

Build, review, migrate, and deploy React or Angular apps hosted by Salesforce as
UIBundle metadata. Includes Data SDK/GraphQL, internal and Experience Cloud apps,
ACC, localization and extensions, embedding, packaging, and adaptable examples.

## Install

```bash
npx skills add dylandersen/sf-multiframework --global
```

## Contents

- [Changelog](CHANGELOG.md): high-level release updates.
- [SKILL.md](SKILL.md): concise decisions, platform invariants, and task routing.
- [Official sources and research findings](references/official-sources.md): full
  guide coverage, primary links, corrections, and feature-specific limits.
- [References](references/overview.md): detailed workflows loaded as needed.
- [Assets](assets/README.md): minimal metadata, Vite, GraphQL, and React examples.

## Current scope

Eligible editions on Hyperforce are Enterprise, Performance, Unlimited, Developer,
and Partner Developer; Alibaba/Government Cloud are excluded. Internal hosting
requires Salesforce app domain and Edge Network. Source API 67+ applies to current
internal metadata/packaging; the i18n runtime needs 68+. Verify the target org
and each feature rather than assuming every capability is available everywhere.

The refresh adds Angular, App Manager/access, labels/extensions/i18n, View SDK/app
identity, internal 2GP distribution, and microfrontend guidance. Internal bundle
embedding remains Beta with narrower restrictions than standalone app hosting.

Copyable examples correct the integer XML schema version, qualified app reference,
Vite plugin default export, SDK status hooks, cache miss semantics, and ACC mount
API. The entrypoint routes to optional workspace/LLM patterns without requiring
those architectures for ordinary app work.

Built from Salesforce's developer guides, published package declarations, and
[Multi-Framework Recipes](https://github.com/trailheadapps/multiframework-recipes).
Format inspired by [Jag Valaiyapathy's SF Skills](https://github.com/Jaganpro).
Hands-on deployment contributions are credited in [CREDITS.md](CREDITS.md).

## License

MIT
