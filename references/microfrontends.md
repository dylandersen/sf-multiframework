# Microfrontends and UI Embedding

Reviewed 2026-10-08. Distinguish two documented release scopes:

| Hosting | Current documentation | Consequence |
|---|---|---|
| External HTTPS app | [UI Embedding](https://developer.salesforce.com/docs/platform/microfrontend/guide) describes the host component as GA | Use the current component/protocol, not preview recipes verbatim |
| Internal Salesforce-hosted UIBundle | [Internal UI Bundles](https://developer.salesforce.com/docs/platform/microfrontend/guide/internal-ui-bundles.html) and [Multi-Framework embedding](https://developer.salesforce.com/docs/platform/multiframework/guide/mfw-ui-embedding.html) say Beta | Explicit full app URL, manual CSP; internal embedding page currently says React only and no dynamic resolution/packaging |

The general UI Embedding guide requires an eligible Hyperforce edition with English as the default org language. This embedding constraint is separate from application localization support.

The general app guide supports Angular hosting. That does not override the
narrower internal-embedding limitation. Confirm the target release before
promising internally hosted Angular embedding or packageable wrappers.

## Standalone app first

Deploy an internal bundle, companion CustomApplication, and intended access
permissions. Launch it from App Launcher and **copy the actual full
`*.salesforce.app` URL**. Use that URL as `src`; don't synthesize it from the
org alias or reuse a Beta `/lwr/application/ai/` path. Confirm Edge Network when
standalone launch fails.

For an internal bundle embedded on a Lightning page, the current internal guide
requires a Trusted URL allowing `*.salesforce.app` under `frame-src`. On an
Experience Cloud page, it additionally documents the org Lightning domain and
My Domain under `frame-src`, the **Experience site's origin** under Trusted
Domains for Inline Frames with type **UIEmbedding**, and disabling the first-party
Salesforce cookie requirement. These are distinct from ACC's **Lightning Out**
trust setting. Apply the minimum documented configuration within authorized scope.

For external apps, trust the exact HTTPS origin as the UI Embedding guide directs.
It must differ from the Salesforce origin; same-origin src is rejected.

## Host wrapper and guest SDK

Write a thin LWC wrapper containing:

```html
<template>
  <lightning-ui-embedding lwc:ref="embeddedApp" src={appUrl}
    title="Account workspace"></lightning-ui-embedding>
</template>
```

Then place the wrapper in Lightning App Builder or a separate Experience page.
A recent CLI can generate the wrapper with `sf template generate ui-embedding`;
check `--help` for flags. You cannot drag a raw UIBundle into App Builder.

The guest imports `@salesforce/platform-sdk/ui-embedding` and uses
`createViewSDK` from `/view`. All host methods remain optional. The alternative
package-free path implements the versioned `sf-embedding` protocol; follow its
full official bridge/security guide rather than inventing ad hoc postMessage.

Attach `sf-embedding.component.ready` and `sf-embedding.component.error`
listeners imperatively to the embedding element in `renderedCallback` because
these event names contain dots. Avoid duplicate listeners across renders and
clean them up. Error detail includes phase, code, message, and retryability.
After mount, **do not mutate `src` or `sandbox`**; remount for a new session.
Changing them produces `SESSION_BINDING_MUTATED`.

[Data exchange](https://developer.salesforce.com/docs/platform/microfrontend/guide/exchange-data.html)
uses host props/styles and full replacement snapshots, not patches. SDK state
subscriptions and custom events travel through the bridge. Payloads must be
structured-clone-safe; don't JSON-stringify them or send functions/DOM nodes.
Do not treat props/events as permission grants. The state guide describes one
underlying subscription per session while the SDK exposes listener cleanup;
share host state at the app boundary rather than inventing many bridge sessions.

Use supported theme/state, resize, and dirty-state methods, with fallbacks when
absent. Test wrapper ready/error, remount behavior, data exchange, styling, sizing,
and navigation under the actual intended user/session.

## Preview recipes

The [recipe guide](https://developer.salesforce.com/docs/platform/microfrontend/guide/recipes.html)
explicitly labels `microfrontend-recipes` Developer Preview. It teaches patterns;
its host APIs are not the authority for the current component. Inspect deployed
host support and current documentation before adopting a preview sample.
