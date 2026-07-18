# Experience Cloud React UI Bundle Runbook

Use this runbook when a Multi-Framework React app targets `Experience`, especially when the app has both public and authenticated routes.

## What the Community Resilience Grants demo proved

A React UI Bundle can serve:

- a public transparency page,
- an authenticated external reviewer workspace,
- Salesforce-backed data through Apex REST called with `@salesforce/platform-sdk`,
- Experience Cloud login and forgot-password routes.

The tricky work is not React. It is the Salesforce hosting and security boundary: Experience metadata, site publish, guest Apex access, external user provisioning, and a deliberate choice between platform sharing and a curated Apex API façade.

## 1. Deploy the full Experience metadata stack

Do not deploy only the `UIBundle`. External apps need the full site container metadata:

```text
force-app/main/default/
  digitalExperienceConfigs/
  digitalExperiences/
    site/<SiteName>/
      sfdc_cms__site/<SiteName>/content.json
  networks/
  sites/
  uiBundles/<AppName>/
```

Current generated `content.json` shape uses `contentBody`:

```json
{
  "type": "sfdc_cms__site",
  "title": "CommunityResilienceGrants",
  "contentBody": {
    "authenticationType": "AUTHENTICATED_WITH_PUBLIC_ACCESS_ENABLED",
    "appContainer": true,
    "appSpace": "c__CommunityResilienceGrants"
  },
  "urlName": "communityresiliencegrants"
}
```

Deploy and publish:

```bash
npm run build
sf project deploy start --source-dir force-app -o TARGET_ORG --json
sf community publish --name "<ExperienceName>" -o TARGET_ORG --json
```

Then verify the app-container URL, not only the underlying site URL. In the demo, publish returned a `.../CommunityResilienceGrantsvforcesite` URL, while the React app lived at:

```text
https://<domain>.my.site.com/CommunityResilienceGrants
```

## 2. Public route pattern: guest Apex access, not broad object access

If the public route calls Apex REST, the Experience guest profile needs Apex class access to the endpoint. Without it, the React app can load but API calls return:

```text
403 You do not have access to the Apex class named: <ApiClass>
```

Recommended public pattern:

1. Grant the guest profile access to the curated public Apex endpoint only.
2. Do not grant broad guest object permissions unless the app intentionally relies on UI API/object sharing.
3. Run the public query behind Apex and select only fields safe for unauthenticated visitors.
4. Make the publication criteria explicit.

Example public criteria from the grants demo:

```soql
WHERE Publish_to_Transparency_Board__c = true
  AND Stage__c = 'Approved'
  AND Final_Decision__c = 'Awarded'
WITH SYSTEM_MODE
```

The public payload omitted applicant PII, internal notes, reviewer identities, reviewer comments, and internal assignment data.

## 3. Auth routes: login and forgot password Apex access

Generated external app templates can include React login and forgot-password pages backed by Apex REST classes such as:

- `UIBundleLogin`
- `UIBundleForgotPassword`
- `UIBundleChangePassword`
- `UIBundleRegistration`

The guest profile must have Apex access to whichever unauthenticated auth endpoints the app uses. A missing grant shows up as a 403 before the login logic runs.

Smoke test login endpoint access with a known-bad password. The desired failure is an application-level invalid-password response, not an Apex-access 403:

```bash
curl -i -X POST \
  'https://<site>/CommunityResilienceGrants/sf/api/services/apexrest/auth/login' \
  -H 'Content-Type: application/json' \
  --data '{"email":"user@example.com","password":"wrong","startUrl":"/reviewer"}'
```

Expected after Apex access is correct:

```text
400 {"errors":["Invalid username or password."]}
```

## 4. External reviewer user provisioning checklist

A Contact is not enough. For an authenticated reviewer route, provision a real external user linked to that Contact.

Checklist:

1. Confirm the reviewer Contact exists and has the desired email.
2. Pick a standard external profile/license available in the org as the **source profile** only, for example `Customer Community User`.
3. Clone that source profile into an app-specific profile, for example `Community Resilience Reviewer`. Do not assign demo users to the stock standard external profile directly.
4. Add the cloned profile to the Experience site's `networkMemberGroups`.
5. If using standard external profiles as clone sources, enable the Digital Experiences setting behind `CommunitiesSettings.enableOotbProfExtUserOpsEnable`.
6. Ensure the reviewer Contact's Account owner has a User Role. Otherwise external user creation fails with:

   ```text
   portal account owner must have a role
   ```

7. Create the external `User` with:
   - `Username`
   - `Email`
   - `FirstName` / `LastName`
   - `Alias`
   - `CommunityNickname`
   - `ProfileId` set to the cloned profile, not the stock source profile
   - `ContactId`
   - locale/timezone/email encoding fields
8. Assign the app permission set.
9. Request a password reset email or set an initial password through the approved admin flow.

Common error when the org setting in step 5 is off:

```text
To create or update users for this profile, go to Setup > Digital Experiences > Settings and select Allow using standard external profiles for self-registration, user creation, and login.
```

## 5. Reviewer data security: sharing vs curated Apex façade

There are two valid patterns. Pick deliberately.

### Pattern A — platform sharing

Use object permissions, sharing rules, Apex managed sharing, or ownership so the Experience user has record access. Then Apex/GraphQL can use user-mode reads.

Pros:

- More declarative and auditable by admins.
- `WITH USER_MODE` and UI API align with platform record access.

Cons:

- Requires careful sharing design for parent applications and child assignments.
- Can be more setup-heavy for demos.

### Pattern B — curated Apex façade

Keep external users' direct object access narrow or absent. Apex runs system-mode queries but derives authorization from the current session and filters server-side.

Required guardrails:

- Never accept reviewer ContactId or UserId from the client.
- Derive ContactId from `UserInfo.getUserId()` server-side.
- Query assignments with `Reviewer__c = currentUser.ContactId`.
- Query applications only by assignment-derived IDs.
- Validate the same reviewer scope before DML.
- Use separate payload builders for public, reviewer, and internal views.
- Do not expose generic `loadById` endpoints to external users.

The grants demo used Pattern B after `UserRecordAccess` showed the reviewer could authenticate but had no direct read access to assignment records.

## 6. Experience smoke tests

Run the smallest direct checks before browser testing:

```bash
# Public app container loads
curl -i 'https://<site>/<AppPath>/'

# Public API returns real curated data, not sample fallback
curl -s 'https://<site>/<AppPath>/sf/api/services/apexrest/<api>?view=public' | jq

# Guest is blocked from non-public views
curl -i 'https://<site>/<AppPath>/sf/api/services/apexrest/<api>?view=internal'

# Guest is blocked from mutations
curl -i -X POST 'https://<site>/<AppPath>/sf/api/services/apexrest/<api>' \
  -H 'Content-Type: application/json' \
  --data '{"action":"submitScore"}'

# Login endpoint is reachable and fails for a bad password at the app layer
curl -i -X POST 'https://<site>/<AppPath>/sf/api/services/apexrest/auth/login' \
  -H 'Content-Type: application/json' \
  --data '{"email":"user@example.com","password":"wrong","startUrl":"/reviewer"}'
```

## 7. Troubleshooting quick map

| Symptom | Likely cause | First fix |
|---|---|---|
| Public page shows fallback sample data and `403` | Guest lacks Apex class access | Grant guest profile access to the curated endpoint only. |
| Public page shows too many records | Public criteria too broad | Filter on final publication/award semantics, not only a visibility flag. |
| Login POST returns Apex `403` | Guest lacks auth Apex class access | Grant guest access to login/forgot-password classes used by the template. |
| External user creation fails: standard external profile setting | Digital Experiences setting off while using/cloning a standard external profile | Enable standard external profile user creation/login setting, then assign users to a cloned app-specific profile. |
| External user creation fails: account owner role | Contact account owner has no role | Create/assign an internal user role to the account owner. |
| Reviewer logs in but sees no assignments | Auth works, but record sharing/user-mode query returns zero rows | Add platform sharing or switch to a curated Apex façade scoped by ContactId. |
