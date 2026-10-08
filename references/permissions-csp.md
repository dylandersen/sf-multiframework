# Permissions, origins, and resource loading

Reviewed 2026-10-08 against [app access](https://developer.salesforce.com/docs/platform/multiframework/guide/mfw-manage.html)
and [org setup](https://developer.salesforce.com/docs/platform/multiframework/guide/mfw-setup.html).

## Internal app grants

App visibility and Salesforce data access are separate:

| Grant | Purpose |
|---|---|
| CustomApplication visibility via permission set or profile | App Launcher access |
| **API Enabled** | Supported API requests |
| Object CRUD and field read/edit | Data the app queries/mutates |
| Record sharing | Which records the running user can access |
| Agent access when ACC is used | Intended Employee Agent |

Full internal templates generate `<AppName> Access` for visibility/API access.
Deploying it does not assign it. Use the actual developer name:

```bash
sf org assign permset --name MyApp_Access --target-org TARGET_ORG
```

For manually authored app access, metadata can include:

```xml
<PermissionSet xmlns="http://soap.sforce.com/2006/04/metadata">
    <applicationVisibilities>
        <application>MyApp</application>
        <visible>true</visible>
    </applicationVisibilities>
    <label>My App Access</label>
    <userPermissions>
        <enabled>true</enabled>
        <name>ApiEnabled</name>
    </userPermissions>
</PermissionSet>
```

The application name references the CustomApplication, not necessarily the bundle
folder. Add object/field grants appropriate to the app separately. Prefer this
source-managed access over creating anonymous-Apex `SetupEntityAccess` rows as a
mandatory setup step. Profiles are also supported; preserve the team's approach.

UI API enforces CRUD/FLS/sharing/validation. Inaccessible fields may generate
GraphQL errors or disappear with `@optional`; null can also mean legitimately
empty data. Inspect schema, errors, and user access instead of promising silent
nulls for every FLS failure.

## External site and custom Apex

External apps use site guest/authenticated settings and audience licenses. An
App Launcher tile does not grant a guest access to records. Verify endpoint
access, profile/permission grants, sharing, and actual site-session behavior.

Apex REST transport through the SDK does not enforce your business authorization
for you. With-sharing controls record sharing, not CRUD/FLS alone. Apply user-mode
operations or explicit permission checks, derive user/contact scope server-side,
and do not trust client identifiers as access grants. The custom façade/login
patterns in [experience-cloud-runbook.md](experience-cloud-runbook.md) are optional
app architecture; choose them only if they match the user's needs.

## CSP and iframe trust are different directions

Inspect the actual browser violation and response policy before changing origins.
Do not assume the Lightning host's CSP is identical to a standalone app's policy.
CSP directives such as `img-src`, `font-src`, `connect-src`, and `frame-src` govern
resource loading. Trusted Domains for Inline Frames governs who may frame
Salesforce content. A CSP change does not resolve a missing user permission.

- ACC: trust the app/preview origin with iframe type **Lightning Out** and apply
  the documented cookie setting. See [acc-integration.md](acc-integration.md).
- Internal bundle embedding: the current Beta guide requires app-domain CSP and,
  for an Experience host, redirect domains, **UIEmbedding** trust, and cookie
  configuration. See [microfrontends.md](microfrontends.md).
- Third-party resources: add only the supported Trusted URL directives needed
  for the actual surface. Bundle dependencies locally where feasible. Don't
  assume a Trusted URL allows remote JavaScript; verify script policy separately.
- Third-party secrets/callouts: keep credentials server-side with the team's
  integration/Named Credential pattern, not in bundle source.

Verify the intended user can launch, query, and perform allowed writes. Test an
unauthorized path when changing access logic, and keep grant changes in scope.
