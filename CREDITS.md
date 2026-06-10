# Credits

## sf-multiframework Skill

Written and maintained by **Dylan Andersen**.

The format, rubric structure, and cross-skill orchestration conventions used in this skill were inspired by [Jag Valaiyapathy's SF Skills](https://github.com/Jaganpro) — the same patterns that shape `developing-agentforce`, `generating-lwc-components`, `generating-apex`, and the broader [Salesforce SF Skills family](https://github.com/forcedotcom/sf-skills).

## Author

- **Dylan Andersen** — skill design, reference expansion, recipe-pattern distillation, and ongoing maintenance

## Contributors

- [**Evan Jochims**](https://github.com/ejochims) — Distinguished, Strategic Solution Engineer at Salesforce; Summer '26 / API v67.0 deployment feedback covering `CustomApplication`, app access, API version, launch URLs, and current CLI templates

## Inspiration

- **Jag Valaiyapathy** — skill format, scoring rubric, and cross-skill orchestration conventions that this skill follows

## References & Inspiration

### Official Salesforce Documentation

- [Build a React App with Salesforce Multi-Framework (Beta) — Overview](https://developer.salesforce.com/docs/platform/einstein-for-devs/guide/reactdev-overview.html)
- [Configure Your Org for React Development (Beta)](https://developer.salesforce.com/docs/platform/einstein-for-devs/guide/reactdev-setup.html)
- [Integrate Your React App with the Agentforce 360 Platform (Beta)](https://developer.salesforce.com/docs/platform/code-builder/guide/reactdev-integrate.html)
- [Develop a React App Manually (Beta)](https://developer.salesforce.com/docs/platform/einstein-for-devs/guide/reactdev-develop.html)
- [Data SDK and GraphQL (Beta)](https://developer.salesforce.com/docs/platform/einstein-for-devs/guide/reactdev-data-sdk.html)
- [Access Record Data with Data SDK (Beta)](https://developer.salesforce.com/docs/platform/code-builder/guide/reactdev-data-sdk-usage.html)
- [Error Handling in Data SDK (Beta)](https://developer.salesforce.com/docs/platform/code-builder/guide/reactdev-data-sdk-graphql-error.html)
- [Style Your React Apps (Beta)](https://developer.salesforce.com/docs/platform/code-builder/guide/reactdev-styling.html)
- [Integrate Agentforce Conversation Client (Beta)](https://developer.salesforce.com/docs/platform/einstein-for-devs/guide/reactdev-acc.html)
- [React vs LWC (Beta)](https://developer.salesforce.com/docs/platform/code-builder/guide/reactdev-lwc-diff.html)

### Reference Implementation

- [`trailheadapps/multiframework-recipes`](https://github.com/trailheadapps/multiframework-recipes) — canonical React-on-Salesforce recipes; `AGENT.md` in that repo was a primary input for recipe conventions, data-access patterns, and styling guidance.

### Related SF Skills (Jag's framework, inspiration for this skill's conventions)

The [`forcedotcom/sf-skills`](https://github.com/forcedotcom/sf-skills) repo renamed its skills (the original release used `sf-*` names). Both names are listed below so this skill resolves the right delegate whether you're on the current or original `sf-skills` release.

| Current name | Older `sf-skills` alias | Scope |
|---|---|---|
| [`developing-agentforce`](https://github.com/forcedotcom/sf-skills/tree/main/skills/developing-agentforce) | `sf-ai-agentforce` / `sf-ai-agentscript` | Builder metadata + `.agent` Agent Script agents (ACC target) |
| [`testing-agentforce`](https://github.com/forcedotcom/sf-skills/tree/main/skills/testing-agentforce) | `sf-ai-agentforce-testing` | Agent test specs / evaluations |
| [`generating-lwc-components`](https://github.com/forcedotcom/sf-skills/tree/main/skills/generating-lwc-components) | `sf-lwc` | LWC authoring |
| [`generating-apex`](https://github.com/forcedotcom/sf-skills/tree/main/skills/generating-apex) | `sf-apex` | Apex classes / `@RestResource` |
| [`querying-soql`](https://github.com/forcedotcom/sf-skills/tree/main/skills/querying-soql) | `sf-soql` | SOQL helpers for backing Apex |
| [`deploying-metadata`](https://github.com/forcedotcom/sf-skills/tree/main/skills/deploying-metadata) | `sf-deploy` | metadata deploy orchestration |
| [`generating-permission-set`](https://github.com/forcedotcom/sf-skills/tree/main/skills/generating-permission-set) | `sf-permissions` | permission sets for UI bundles |
| [`building-sf-integrations`](https://github.com/forcedotcom/sf-skills/tree/main/skills/building-sf-integrations) | `sf-integration` | Named Credentials / callouts |

## License

MIT License — see [LICENSE](LICENSE).
