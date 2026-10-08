# Authoring tools and Salesforce context

Reviewed 2026-10-08 against [Build with Agentic Coding Tools](https://developer.salesforce.com/docs/platform/multiframework/guide/mfw-agentic-tools.html).
Salesforce Multi-Framework supports standard DX/npm workflows in any editor.
Agentforce Vibes, Claude Code, Cursor, OpenCode, or another agentic tool are
choices; don't install or switch tools without a task need.

Generated projects include `AGENT.md`. Read the actual workspace context and
package scripts; older context can lag APIs. The current recipes' AGENT.md still
contains Beta SDK imports and a one-bundle restriction despite newer package/code
and guide examples. Prefer current API declarations and guide pages for those
contracts while retaining useful local recipe conventions.

## Optional Salesforce skills library

Salesforce documents `npx skills add forcedotcom/sf-skills` for non-Vibes tools;
Vibes installs/updates its skills automatically. Skill names/layout are explicitly
unstable. Inspect the available library rather than depending on old hardcoded
`generating-*` aliases or requiring another skill to complete ordinary work.
This skill is self-contained; related skills can help when available and relevant.
Installing them does not expand authorization to mutate an org.

## Optional Salesforce DX MCP

Authorize the target org with Salesforce CLI. Configure the user's agentic tool
with the documented server command and arguments:

```json
{
  "mcpServers": {
    "salesforce": {
      "command": "npx",
      "args": ["-y", "@salesforce/mcp", "--orgs", "DEFAULT_TARGET_ORG", "--toolsets", "orgs,metadata,data"]
    }
  }
}
```

`orgs` supports auth/open/manage, `metadata` deploy/retrieve, and `data` queries.
Discover actual exposed MCP tool schemas; different clients normalize tool names.
CLI and MCP are alternative interfaces to the same workflow. No MCP connection
is necessary for a local docs edit or framework-only change.

For CMS, current setup links Content Read-Only and Content Write hosted servers.
Configure them only when CMS work needs them. Read-only content discovery does
not authorize publishing through the write server.

## Working in a project

Run npm scripts from the bundle; schema/codegen from the project's configured
scripts; deploy from DX root within scope. Use the Data SDK instead of frontend
raw Salesforce requests. Do not manually edit generated schema/types. Local UI
checks can use mocks; live data checks require the authorized org.

Builder Central (Beta) is the guided no-code React authoring path, distinct from
code-first React/Angular development. Preserve the user's chosen surface and
apply references relevant to that task.
