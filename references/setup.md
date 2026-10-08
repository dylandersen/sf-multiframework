# Org and development setup

Reviewed 2026-10-08 against [Set Up Your Org](https://developer.salesforce.com/docs/platform/multiframework/guide/mfw-setup.html).

## Eligibility and internal hosting

The documented editions are Enterprise, Performance, Unlimited, Developer, and
Partner Developer, hosted on Hyperforce. Alibaba Cloud and Salesforce Government
Cloud are excluded. Verify Company Information and the org release rather than
promising support for every edition or every production/sandbox environment.

Internal apps require the Salesforce app domain and Salesforce Edge Network.
With **Customize Application**, open Setup → **Salesforce Multi-Framework Apps**.
If **Enable Domain** is present, enable it within the user's authorized setup
scope; otherwise the domain is already enabled. In My Domain → Routing and
Policies, confirm Salesforce Edge Network. Most orgs have the app domain enabled
already. The current guide does not prescribe the old irreversible React
Development toggle or a universal English-only requirement for standalone apps.
UI Embedding has its own English-default constraint; see [microfrontends.md](microfrontends.md).

Use the latest Salesforce CLI and Extension Pack, plus the generated project's
Node engine. Current recipes use Node 22+. Authenticate the intended org with
`sf org login web --alias ALIAS`, then set it as the project default if needed.
Do not change the global default merely to inspect an existing app.

```bash
sf plugins install @salesforce/plugin-ui-bundle-dev
sf template generate project --help
sf template generate ui-bundle --help
```

## External apps

Enable Digital Experiences and verify licenses for the intended audience:
Customer Community/Customer Community Plus for B2C; Partner Community/Channel
Account for B2B. Generate an external project rather than creating an arbitrary
placeholder site. Keep the generated DigitalExperience, DigitalExperienceConfig,
Network, and CustomSite metadata. Developer orgs support only the `c` namespace
per the current setup guide. See [templates.md](templates.md).

## Optional ACC configuration

For internal Employee Agent ACC, configure an Employee Agent with topics/actions
and enable Agentforce. In My Domain, deselect **Require first-party use of
Salesforce cookies**. Under Session Settings → **Trusted Domains for Inline
Frames**, add the actual app/preview origin, including the port, with iframe
type **Lightning Out**. These settings are specific to this integration, not
requirements for every frontend app. See [acc-integration.md](acc-integration.md).

## Optional authoring integrations

Any editor or agentic coding tool can work with the standard DX/npm project.
Agentforce Vibes is optional. For Salesforce DX MCP and Salesforce's skills
library, see [authoring-surface.md](authoring-surface.md).

CMS authoring can use Salesforce's Content Read-Only and Content Write hosted
MCP servers. Follow their current setup guides linked from the official org
setup page; do not carry forward a blanket DE/scratch-only assumption or activate
write/publish tools for a read-only task.
