# Beta → GA Migration

If you built on the Beta of Salesforce Multi-Framework, there are **five breaking changes** to make before deploying on GA (API v67.0+, Summer '26 release or later). The ingredients live across the skill; this is the ordered playbook.

## The five breaking changes (at a glance)

1. **Rename the Data SDK import** from `@salesforce/sdk-data` → the `@salesforce/platform-sdk/data` subpath (the package you install is `@salesforce/platform-sdk`; imports come from its `/data` entry point).
2. **Split `graphql()` calls** into `.query()` (reads) and `.mutate()` (writes).
3. **Optional-chain through `result?.data`** — it can now be `undefined`.
4. **Replace `<target>AppLauncher</target>` with `<target>CustomApplication</target>`** in `.uibundle-meta.xml`, add a `CustomApplication` metadata file with a `<uiBundle>` reference, and add a permission set granting visibility.
5. **Remove the deprecated `UiBundleSettings` scratch config** — it's no longer needed.

Your GraphQL queries and mutations themselves are unchanged — only the client library that wraps them changed.

## 1–3. Data SDK code migration

### Package rename

```diff
- import { createDataSDK, gql } from '@salesforce/sdk-data';
+ import { createDataSDK, gql } from '@salesforce/platform-sdk/data';
```

Update `package.json` too: remove `@salesforce/sdk-data`, add `@salesforce/platform-sdk`. (The dependency name is the bare package; the import path is the `/data` subpath. The GA blog abbreviated the import as `@salesforce/platform-sdk` — the API reference uses `@salesforce/platform-sdk/data`; verify against your installed package.)

### Reads → `.query()`, writes → `.mutate()`

The Beta funneled both reads and writes through a single generic `graphql()` method with a `query` key. At GA they're separate methods, and the parameter key matches the operation type.

```diff
  const sdk = await createDataSDK();

- // Reads and writes both used .graphql() with a `query` key
- const result = await sdk.graphql?.<QueryResponse>({ query: MY_QUERY });
- const mutationResult = await sdk.graphql?.<MutationResponse>({
-   query: MY_MUTATION,
-   variables: { input },
- });
+ // Reads use .query() with a `query` key
+ const result = await sdk.graphql?.query<QueryResponse>({ query: MY_QUERY });
+ // Writes use .mutate() with a `mutation` key
+ const mutationResult = await sdk.graphql?.mutate<MutationResponse>({
+   mutation: MY_MUTATION,
+   variables: { input },
+ });
```

(If your Beta code used the even older `sdk.graphql?.(QUERY, variables)` positional form, that is also gone — move to `.query()` / `.mutate()`.)

### `result.data` is now possibly `undefined`

The response typing is stricter at GA: `result.data` is modeled as potentially `undefined`. Optional-chain the whole path.

```diff
- const edges = result?.data.uiapi?.query?.Account?.edges;
+ const edges = result?.data?.uiapi?.query?.Account?.edges;
```

Full SDK reference: [data-sdk.md](data-sdk.md). Error strategies: [error-handling.md](error-handling.md).

## 4. Metadata migration (employee apps)

1. **Bump the API version.** Set `sourceApiVersion` to `67.0` (or higher) in `sfdx-project.json`. The `uiBundle` field on `CustomApplication` does not exist in v66.0.
2. **Flip the target.** In `<bundle>.uibundle-meta.xml`, change `<target>AppLauncher</target>` → `<target>CustomApplication</target>`. `AppLauncher` is rejected on v67.0. (The `Experience` target for customer-facing apps is unchanged.)

   ```xml
   <UIBundle xmlns="http://soap.sforce.com/2006/04/metadata">
       <masterLabel>My App</masterLabel>
       <description>A React app on Salesforce.</description>
       <isActive>true</isActive>
       <version>1</version>
       <target>CustomApplication</target>
   </UIBundle>
   ```
3. **Add the companion Custom Application** that references the bundle via `<uiBundle>`. This ties the UI Bundle to the App Launcher.

   ```xml
   <CustomApplication xmlns="http://soap.sforce.com/2006/04/metadata">
       <label>My React App</label>
       <navType>Standard</navType>
       <uiBundle>c__myReactApp</uiBundle>
       <uiType>Lightning</uiType>
       <formFactors>Large</formFactors>
   </CustomApplication>
   ```
4. **Grant visibility with a permission set.** A brand-new `CustomApplication` is invisible in the App Launcher by default — even for System Administrator.

   ```xml
   <PermissionSet xmlns="http://soap.sforce.com/2006/04/metadata">
       <applicationVisibilities>
           <application>myReactApp</application>
           <visible>true</visible>
       </applicationVisibilities>
       <label>My React App Access</label>
       <hasActivationRequired>false</hasActivationRequired>
   </PermissionSet>
   ```

   (You can equivalently add `applicationVisibilities` to a profile.)
5. **Deploy bundle + app + permission set together** in a single transaction. Deploying the `CustomApplication` before the `UIBundle` exists fails.
6. **Launch from the App Launcher** (or the `salesforce.app` URL: `https://<org>--<namespace>.<instance>.my.salesforce.app/app/c__<bundleName>`, e.g. `https://acme-corp-dev-ed--c.scratch.my.salesforce.app/app/c__myReactApp`). Never use the old `/lwr/application/ai/c-<bundle>` URL — that was the Beta access path and no longer carries a usable session post-GA (the shell renders, then every Data SDK / Apex REST call fails with `INVALID_SESSION_ID`).
7. **Moving to a new/clean org?** The frontend alone won't work. Also deploy the Apex backend (`@RestResource` class and its full dependency tree) and every custom object it touches, or the app loads and the first call returns `Could not find a match for URL`.

## 5. Remove the deprecated scratch config

Delete any `UiBundleSettings` / `webAppOptIn` block from your scratch definition. On the Summer '26 release or later, Multi-Framework is enabled with no opt-in. See [ci-deploy.md](ci-deploy.md).

## Do you need to delete first?

Common migration advice says you must `sf project delete source` the old bundle first because the stale Beta `AppMenuItem` won't regenerate. In practice a straight redeploy works in a GA-enabled org — and the source delete can itself fail with an opaque internal error. **Try the clean redeploy first;** only delete and recreate if a stale tile genuinely persists in the App Launcher.

## Prerequisite

The org must be on the **Summer '26 release or later** with **Salesforce Multi-Framework** enabled in Setup (one-way toggle; enabled orgs show the "Enable Salesforce App Domain" toggle on). If it's off, the deploy fails with `UIBundle Metadata API is not enabled because the … feature gate is disabled` (and/or `The specified field isn't valid: uiBundle`). See [setup.md](setup.md).
