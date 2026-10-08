# Agentforce Conversation Client

Reviewed 2026-10-08 against [ACC in a React App](https://developer.salesforce.com/docs/platform/multiframework/guide/reactdev-acc.html)
and published `@salesforce/agentforce-conversation-client` **12.11.0**.

## Select the right integration

- Internal B2E React app with Employee Agent: ACC package and org configuration.
- External React app with Service Agent: **Enhanced Chat v2**, as the current
  guide directs; do not reuse the internal employee integration indiscriminately.
- Standalone web app outside Salesforce: [ACC SDK guide](https://developer.salesforce.com/docs/platform/accsdk/overview).
- LWC controlling the native side panel: [ACC API](https://developer.salesforce.com/docs/platform/accsdk/guide/acc-api.html).

## Setup

Configure an Employee Agent with topics/actions and enable Agentforce. Deselect
**Require first-party use of Salesforce cookies** in My Domain. Add the exact
host and local preview origins to Session Settings → Trusted Domains for Inline
Frames with type **Lightning Out**. Grant the intended user's agent access.
These are optional integration prerequisites, not setup for every UIBundle.

Install in the bundle: `npm install @salesforce/agentforce-conversation-client`.
Inspect the installed declarations before changing mount/config code.

## Verified API and lifecycle

The current guide's prose still says `createAccWidget`, but its sample and
12.11.0 root exports use **`embedAgentforceClient`**. The latter package has no
root `createAccWidget` export. Options use nested `agentforceClientConfig`, with
agentId, optional agentLabel, renderingConfig and styleTokens. Current rendering
modes are `floating` and `inline`; a docked layout uses an inline host container.
Do not invent `mode: "docked"`, `brand`, or a `destroy()` handle.

The published implementation requires **salesforceOrigin or frontdoorUrl** even
though its option type marks both optional. Obtain the authenticated embedding
configuration through the supported host/preview setup; don't generate a token
in browser code or commit a session-bearing frontdoor URL. The guide requires a
configured agentId; treat it as required in the app even though the type is optional.

Mount into a dedicated `useRef` container inside `useEffect`, provide explicit
ready/error behavior, and keep the container stable across ordinary renders.
Remove the mounted container children on cleanup as the official example does.
An inline host needs a real height. [AccChatPanel.tsx](../assets/examples/AccChatPanel.tsx)
is a typed starter; supply authenticated options appropriate to the surface.

12.11.0's handle exposes loApp/chatClientComponent and bridge methods, rather than
a generic destroy method. For frontdoor-only sessions it also exposes
`setFrontdoorUrl`, preserving the conversation while renewing auth. Its
`agentforce:frontdoorurlrequired` event/session-management hook asks the host for
recovery credentials; the host owns minting those credentials. Review installed
session APIs before implementing recovery; do not repeatedly recreate the chat
on normal navigation or log credential-bearing URLs.

## Verification

Check the actual agent/user, cookie policy, exact origins, and console/ready-error
events. Verify the FAB or inline panel, agent connection, streaming, and Lightning
Types rendering. Diagnose agent/action schema separately from frontend mount
failures. Test cleanup/remount so React StrictMode or route transitions do not
leave duplicate widgets. Style tokens must come from the installed package's
supported names rather than speculative branding objects.
