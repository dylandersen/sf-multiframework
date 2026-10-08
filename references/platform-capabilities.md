# SDK extensions, localization, identity, and host UI

Reviewed 2026-10-08 against the current Multi-Framework API pages and SDK 12.11.0
exports. Read the sections relevant to the requested feature.

## Custom labels and extensions

[Labels](https://developer.salesforce.com/docs/platform/multiframework/guide/data-sdk-extension-label.html)
are opt-in through `/data/extensions`, not LWC custom-label imports:

```ts
import { createDataSDK } from "@salesforce/platform-sdk/data";
import { labels } from "@salesforce/platform-sdk/data/extensions";

const sdk = await createDataSDK({ extensions: [labels()] });
const greeting = (await sdk.ext.labels.get?.("Greeting_Label")) ?? "Hello";
const messages = await sdk.ext.labels.getAll?.(["Save_Button", "Cancel_Button"]);
```

The extension's documented minimum API is **64.0**. Configure namespace, locale,
and fallback (`BASE_VALUE`, `USER_DEFAULT`, `NONE`) globally or per call.
Unresolved single labels return undefined; batched results omit unresolved keys.
`getAll` deduplicates and batches at 100 names; bound/throttle very large loads.

For [custom extensions](https://developer.salesforce.com/docs/platform/multiframework/guide/data-sdk-extension-custom.html),
use `defineDataExtension` (root SDK export; also exported by `/data` in 12.11.0).
Give it a literal unique name and setup function. Detect absent GraphQL/fetch in
setup and omit unsupported methods. Pass extensions inline or `as const` to
preserve tuple typing. `{ extension, as }` aliases disambiguate names. A declared
`minApiVersion` rejects SDK creation before setup when the resolved API is too old;
on unversioned surfaces the check is skipped. A version check is not a capability check.

## Locale formatting and translation runtime

[Localize Your App](https://developer.salesforce.com/docs/platform/multiframework/guide/data-sdk-i18n.html)
documents a separate **API 68.0+** runtime:

```ts
import { fetchI18nContext, createI18nFormatters } from "@salesforce/platform-sdk/i18n";

const context = await fetchI18nContext(sdk);
const { formatDate, formatCurrency } = createI18nFormatters(context);
const dateText = formatDate(new Date());
const amountText = formatCurrency(1000);
```

Context includes `lang`, `locale`, `dir`, `currency`, and `timeZone`. Translation
language and formatting locale differ; currency is the org currency, not a guess
from the user's region. GraphQL is required; handle rejection. The context is
page-cached. `reloadI18nContext(sdk)` clears then refetches, and a failed reload
leaves it empty until a later successful fetch.

For i18next, `SalesforceBackend` accepts `dataSDK`, namespaced `labelManifest`
entries such as `c:Save_Button`, and optional `labelFallback`.
`createSalesforceDetector` supplies the resolved language after context loading.
The backend runtime needs API 68+, independently of the labels extension's 64+
minimum; older orgs may render raw keys. Salesforce label `{0}` placeholders need
already formatted date/number strings. Do not promise localization simply by
changing the org's default language.

## Runtime app identity

[Get App Identity](https://developer.salesforce.com/docs/platform/multiframework/guide/data-sdk-identity.html):

```ts
import { getCurrentApp } from "@salesforce/platform-sdk";
const { identity } = await getCurrentApp();
const qualifiedName = identity?.qualifiedName;
```

Identity has namespace, appName, qualifiedName, and optional bundleId. Local dev
can omit the entire identity; provide a meaningful fallback and validate bundleId
before use. The call degrades without rejecting. Resolve ambient identity where
needed rather than caching it permanently. An identity passed to custom Apex is
context, not an authorization boundary; the server must enforce access.

## Host UI and events

[Manage the Host UI](https://developer.salesforce.com/docs/platform/multiframework/guide/data-sdk-view.html)
uses `/view`:

```ts
import { createViewSDK } from "@salesforce/platform-sdk/view";
const view = await createViewSDK();
await view.displayToast?.({ message: "Saved", level: "success" });
view.markDirtyState?.("editor");
view.clearDirtyState?.("editor");
```

All methods are optional. Standalone apps may resolve an empty SDK; provide local
UI when needed instead of silently losing essential feedback. `getViewSDK()` is a
shared instance whose first options win; `getViewSDKSync()` is null before ready.
Other capabilities include alert/modal, navigateTo, getTheme, getUiState, resize,
and optional EventTarget methods. Use the supported host contract; don't assume
all methods exist on a microfrontend or directly manipulate the parent DOM.

`getUiState()` exposes props/styles and a subscription. Guard late async results
and detach listeners/subscriptions on unmount. For embedding setup, full snapshots,
structured-clone payloads, and lifecycle events, read [microfrontends.md](microfrontends.md).
