# Permissions, Trusted Sites, and Resource Loading

Two separate gates control what a UIBundle app can do in an org:

1. **Permission sets** — who can run the app and what Salesforce data they can access
2. **CSP Trusted Sites** — which *external* URLs the browser is allowed to load (images, fonts, analytics, Lightning Out hosts for ACC)

Both fail silently in different ways. Plan them upfront.

## Experience Cloud public and reviewer access

External React apps often combine public and authenticated routes. Decide early whether those routes rely on platform sharing or a curated Apex façade.

**Public façade pattern:** give the Experience guest profile Apex class access to the public endpoint, keep direct object access absent unless deliberately required, and select/filter only public-safe fields in Apex. This avoids broad guest data exposure while still letting the React page render real data.

**Reviewer façade pattern:** authenticate the external user, derive the user's `ContactId` server-side, query only records assigned to that Contact, and validate the same scope before DML. Do not accept reviewer ContactId/UserId from the client. If you prefer `WITH USER_MODE` reads, implement platform sharing or Apex managed sharing so `UserRecordAccess` matches the intended reviewer access.

See [experience-cloud-runbook.md](experience-cloud-runbook.md) for the full public route, login, forgot-password, and Contact-linked reviewer provisioning checklist.

## Permission sets for UI bundles

At minimum your end users need:

| Permission | Who needs it | Why |
|---|---|---|
| Object-level read/edit on data the app queries | every user | GraphQL queries enforce org FLS/CRUD |
| Field-level read/edit for every field in GraphQL queries | every user | Missing FLS returns `null` in UI API, not an error |
| `ViewSetup` (if app deep-links into Setup) | admins only | Rare |
| `SetupEntityAccess` grant for the CustomApplication | every internal app user | Without it `AppMenuItem.IsAccessible` can stay `false`, even for admins |
| For **ACC**: `Agentforce` permission + the agent's `<agentAccesses>` | every user using chat | Without `<agentAccesses>` in a permission set, the agent is invisible |

See [`generating-permission-set`](https://github.com/forcedotcom/sf-skills/tree/main/skills/generating-permission-set) for permission-set design, `<agentAccesses>` grants, and audit patterns.

### Starter permission set (`force-app/main/default/permissionsets/myApp.permissionset-meta.xml`)

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<PermissionSet xmlns="http://soap.sforce.com/2006/04/metadata">
    <label>My React App User</label>
    <hasActivationRequired>false</hasActivationRequired>

    <!-- Object + field access for everything the React app queries -->
    <objectPermissions>
        <allowRead>true</allowRead>
        <allowCreate>true</allowCreate>
        <allowEdit>true</allowEdit>
        <object>Account</object>
    </objectPermissions>

    <fieldPermissions>
        <field>Account.Industry</field>
        <readable>true</readable>
        <editable>true</editable>
    </fieldPermissions>

</PermissionSet>
```

After deploying the permission set and the `CustomApplication`, link the permission set to the app with `SetupEntityAccess`.

### Assign at scratch-org setup

```bash
sf org create scratch --definition-file config/project-scratch-def.json --alias devorg --set-default
sf project deploy start --source-dir force-app
sf org assign permset --name myApp
```

### Grant CustomApplication access

Permission set XML grants object and field access, but the App Launcher entry can still be inaccessible until a `SetupEntityAccess` row links the permission set to the app's `ApplicationId`.

```apex
Id permSetId = [
    SELECT Id
    FROM PermissionSet
    WHERE Name = 'myApp'
    LIMIT 1
].Id;

Id appId = [
    SELECT ApplicationId
    FROM AppMenuItem
    WHERE Name = 'MyApp'
    LIMIT 1
].ApplicationId;

insert new SetupEntityAccess(
    ParentId = permSetId,
    SetupEntityId = appId
);
```

Run it with anonymous Apex after deploy, or use an equivalent setup automation. If the app registers in `AppMenuItem` with `IsAccessible = false`, this grant is the first thing to check.

### Silent FLS failures

UI API GraphQL does not throw on missing field access — it returns `null` in the `{ value }` wrapper. If a field is suddenly blank in production but works in dev, check FLS first. Symptom:

```js
account.Phone.value  // → null   (field not readable for this user)
account.Phone        // → { value: null }   (field readable, value is empty)
```

Same wire-level shape, different cause. Add FLS before blaming the query.

## CSP Trusted Sites

Salesforce's Content Security Policy blocks *all* cross-origin requests from the host frame by default. Every non-Salesforce URL — image CDNs, analytics, fonts from Google Fonts, Lightning Out hosts, etc. — needs a `CspTrustedSite` metadata record.

### When you need one

| Loading… | Needs `CspTrustedSite`? |
|---|---|
| Images from an S3 bucket | yes (`isApplicableToImgSrc`) |
| Google Fonts stylesheets | yes (`isApplicableToStyleSrc` + `isApplicableToFontSrc`) |
| Analytics script (Segment, Amplitude, Plausible) | yes (`isApplicableToScriptSrc` + `isApplicableToConnectSrc`) |
| Third-party API via `fetch()` from the React app | yes (`isApplicableToConnectSrc`) — **but prefer a Named Credential + Apex REST** |
| Embedded iframe (e.g. external auth) | yes (`isApplicableToFrameSrc`) — ACC is a special case: see below |

### Metadata example

```xml
<!-- force-app/main/default/cspTrustedSites/AmazonS3Media.cspTrustedSite-meta.xml -->
<?xml version="1.0" encoding="UTF-8" ?>
<CspTrustedSite xmlns="http://soap.sforce.com/2006/04/metadata">
    <context>All</context>
    <description>App media hosted in S3</description>
    <endpointUrl>https://my-bucket.s3.us-west-2.amazonaws.com</endpointUrl>
    <isActive>true</isActive>
    <isApplicableToImgSrc>true</isApplicableToImgSrc>
    <isApplicableToConnectSrc>false</isApplicableToConnectSrc>
    <isApplicableToFontSrc>false</isApplicableToFontSrc>
    <isApplicableToFrameSrc>false</isApplicableToFrameSrc>
    <isApplicableToMediaSrc>false</isApplicableToMediaSrc>
    <isApplicableToStyleSrc>false</isApplicableToStyleSrc>
    <canAccessCamera>false</canAccessCamera>
    <canAccessMicrophone>false</canAccessMicrophone>
</CspTrustedSite>
```

Each `isApplicableTo*` flag maps to a CSP directive:

| Flag | Browser directive | Example resource |
|---|---|---|
| `isApplicableToImgSrc` | `img-src` | `<img src>`, `background-image: url(...)` |
| `isApplicableToStyleSrc` | `style-src` | `<link rel="stylesheet">` |
| `isApplicableToFontSrc` | `font-src` | `@font-face { src: url(...) }` |
| `isApplicableToScriptSrc` | `script-src` | `<script src>` |
| `isApplicableToConnectSrc` | `connect-src` | `fetch()`, `XMLHttpRequest`, WebSocket |
| `isApplicableToFrameSrc` | `frame-src` | `<iframe src>` |
| `isApplicableToMediaSrc` | `media-src` | `<audio>`, `<video>` |

Only enable the flags you actually need — each widens the attack surface.

### Common combos

**Google Fonts**

```xml
<endpointUrl>https://fonts.googleapis.com</endpointUrl>
<isApplicableToStyleSrc>true</isApplicableToStyleSrc>
```

```xml
<endpointUrl>https://fonts.gstatic.com</endpointUrl>
<isApplicableToFontSrc>true</isApplicableToFontSrc>
```

Two sites because Google splits the CSS from the font files.

**Image CDN**

```xml
<endpointUrl>https://cdn.example.com</endpointUrl>
<isApplicableToImgSrc>true</isApplicableToImgSrc>
```

**Analytics that loads a script + sends data**

```xml
<endpointUrl>https://cdn.segment.com</endpointUrl>
<isApplicableToScriptSrc>true</isApplicableToScriptSrc>
```

```xml
<endpointUrl>https://api.segment.io</endpointUrl>
<isApplicableToConnectSrc>true</isApplicableToConnectSrc>
```

## ACC (iframe hosts) — the `frame-src` case

The Agentforce Conversation Client loads Lightning Out into an iframe. For local dev, that iframe's origin is the dev server URL (`http://localhost:5173`). Two configurations need to line up:

1. **Trusted Domains for Inline Frames** (Setup → Session Settings) — platform-level allowlist for what can be *host* of an iframe embedding Salesforce. Type **Lightning Out**.
2. **`CspTrustedSite`** with `isApplicableToFrameSrc: true` — allowlist for what the *React app* is allowed to iframe.

For ACC, **#1 is the one that matters** because the React app is embedding a Salesforce iframe, not the other way around. Full detail in [acc-integration.md](acc-integration.md). Only add a `frame-src` trusted site if the React app embeds a *third-party* iframe (embedded auth, third-party video, etc.).

## CustomApplication access — making the app launch from App Launcher

When the UIBundle target is `CustomApplication`, the platform registers an App Launcher entry through `applications/<AppName>.app-meta.xml`. End users must have app access through `SetupEntityAccess`; legacy `tabSettings` are not enough for the v67 internal-app path.

```soql
SELECT Name, ApplicationId, IsAccessible
FROM AppMenuItem
WHERE Name = 'MyApp'
```

If `IsAccessible` is `false`, insert the `SetupEntityAccess` row shown above for the user's permission set.

## Diagnosing CSP blocks

Browser DevTools → Console prints CSP violations in full:

```
Refused to load the image 'https://cdn.example.com/foo.png' because it violates
the following Content Security Policy directive: "img-src ...".
```

Key facts from the message:
- the **directive name** (`img-src`) → maps to `isApplicableToImg`
- the **URL origin** (`https://cdn.example.com`) → the `endpointUrl`

Add a matching `CspTrustedSite`, redeploy, hard-refresh. CSP is cached — sometimes a Ctrl+Shift+R or new incognito window is needed.

## What NOT to do

- ❌ Don't set `isApplicableToConnectSrc: true` as a shotgun fix — that grants `fetch()` permission to the origin, which is rarely what you want. Use a Named Credential + Apex REST for outbound data calls.
- ❌ Don't manage third-party API auth inside the React app. Named Credential + Apex REST keeps secrets server-side.
- ❌ Don't deploy a permission set with `objectPermissions` but no `fieldPermissions` — UI API queries will return `null` for every field and users will see empty data.
- ❌ Don't rely on profile-level permissions in new work. Permission sets are the supported path for UI bundle access.

## Cross-skill handoff

| Task | Skill |
|---|---|
| Permission-set design / audit / hierarchy | [generating-permission-set](https://github.com/forcedotcom/sf-skills/tree/main/skills/generating-permission-set) |
| Named Credentials for third-party APIs | [building-sf-integrations](https://github.com/forcedotcom/sf-skills/tree/main/skills/building-sf-integrations) |
| Apex REST endpoints for server-side calls | [generating-apex](https://github.com/forcedotcom/sf-skills/tree/main/skills/generating-apex) |
| ACC iframe + cookie configuration | [acc-integration.md](acc-integration.md) |

> On the original `sf-skills` release these are named `sf-permissions`, `sf-integration`, and `sf-apex` — see [CREDITS.md](../CREDITS.md) for the full old→new mapping.
