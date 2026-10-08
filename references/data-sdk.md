# Data SDK

Reviewed 2026-10-08 against [Work with the Data SDK](https://developer.salesforce.com/docs/platform/multiframework/guide/data-sdk-intro.html)
and published `@salesforce/platform-sdk` **12.11.0** declarations. That version
is a research snapshot; use the project's installed declarations and lockfile.

```ts
import { createDataSDK, gql } from "@salesforce/platform-sdk/data";
import type { DataSDK, QueryResult, NodeOfConnection } from "@salesforce/platform-sdk/data";
```

Install the bare `@salesforce/platform-sdk` package. LWC virtual imports such as
`@salesforce/apex/*`, `@salesforce/schema/*`, `@salesforce/user/*`, and `@wire`
are not available; supported SDK subpaths are. Beta `@salesforce/sdk-data` and
callable `sdk.graphql()` need migration; see [beta-to-ga-migration.md](beta-to-ga-migration.md).

## Initialize and detect capabilities

```ts
const sdk = await createDataSDK({
  webapp: {
    onStatus: {
      401: () => signInAgain(),
      403: () => showPermissionsHelp()
    }
  }
});
```

`webapp` also accepts `basePath` (API prefix, not router basename) and `apiVersion`
(`"67.0"`, without `v`). Normally use runtime defaults. Status hooks report the
status; they do not promise automatic retries. Do not use obsolete `on401/on403`
keys or `surface: "webapp"`. If overriding a surface is necessary, use the
installed `Surface` enum; auto-detection is the ordinary path.

The guide documents WebApp, Micro-Frontend, and OpenAI. The published package also
exposes additional surfaces; do not assume a host implements every capability
because an enum exists. WebApp/Micro-Frontend support GraphQL, cache, fetch,
headers and resolved API versions; OpenAI documents uncached GraphQL without
fetch, per-request headers, or webapp options. Guard the operation and distinguish
an absent result from an empty collection:

```ts
const result = await sdk.graphql?.query<AccountsQuery>({ query: QUERY });
if (!result) throw new Error("GraphQL is unavailable on this surface");
if (result.errors?.length) throw new Error(result.errors.map(e => e.message).join("; "));
if (!result.data) throw new Error("No query data returned");
```

## Query, mutate, and response shape

Use named inline `gql` or external `.graphql` documents. `gql` is an identity tag
for editor/codegen recognition; it is not a runtime schema validator. Validate
operations against the authorized org schema. Reads and writes take different keys:

```ts
const read = await sdk.graphql?.query<Response, Variables>({
  query: QUERY, variables, operationName: "Accounts",
  cacheControl: { type: "max-age", maxAge: 60 }
});
const write = await sdk.graphql?.mutate<MutationResponse, MutationVariables>({
  mutation: MUTATION, variables: mutationVariables
});
```

Both support `headers?: HeadersInit`. A query result has `data: T | undefined`,
optional `errors`, `subscribe(callback)` → unsubscribe, and `refresh()` →
`Promise<void>`. A mutation result has only data/errors. Error objects may have
`extensions`; use `extensions.code` for stable branches. Full GraphQL `path`
arrays can include numeric indices even where a doc sketch types them as strings.

UI API record field envelopes such as `Name { value displayValue }` coexist with
scalars such as `Id`, relationships, and connection metadata. Use raw `value` for
logic/writeback and selected `displayValue` for UI formatting. Do not append
`.value` to every field or assume inaccessible fields are present.

`NodeOfConnection<T>` comes from `/data`, not generated operation types. Read
[graphql-workflow.md](graphql-workflow.md) for codegen, CRUD inputs, and pagination.
Use `uiapi.currentUser` for current-user data rather than LWC user imports.

## Reactivity and cache

[Cache control](https://developer.salesforce.com/docs/platform/multiframework/guide/data-sdk-cache-control.html)
and [request headers](https://developer.salesforce.com/docs/platform/multiframework/guide/data-sdk-request-headers.html)
provide the authoritative semantics.

- Stores partition by base URL **and API version**.
- Per-entry key: query, variables, operationName, **headers**. `cacheControl`
  does not change identity. Unique trace headers prevent reuse.
- Default TTL: 300 seconds. Custom `maxAge` must be finite/non-negative; invalid
  values fall back to 300. Zero forces a network fetch on each call.
- `no-cache` revalidates and writes back; it does not mean "never store".
- `only-if-cached` performs no network request. A cold cache **resolves** with
  `result.errors` containing `extensions.code === "CACHE_MISS"`; it does not
  reject with a thrown `DataNotFoundError`.
- Partial data-plus-errors query responses are not cached. Mutations neither
  read nor update the cache.

Handle a cache miss with an explicit network fallback when appropriate:

```ts
let result = await sdk.graphql?.query<AccountsQuery>({
  query: QUERY, cacheControl: "only-if-cached"
});
if (result?.errors?.some(e => e.extensions?.code === "CACHE_MISS")) {
  result = await sdk.graphql?.query<AccountsQuery>({ query: QUERY, cacheControl: "no-cache" });
}
```

`subscribe()` observes later cache/refresh resolutions, not automatic server
record-change pushes. Render the initial snapshot too. In a React effect, guard
async completion after unmount and invoke the unsubscribe during cleanup. In
Angular, use the corresponding destruction hook.

After a mutation, retain and refresh the relevant **query** result or requery
with `no-cache`. A plain repeated query may return its cached pre-write value.
A mutation can have usable data and field-read errors; confirm its operation's
success field (usually returned record Id) before declaring success. Never retry
a write blindly when the response leaves its outcome uncertain.

## REST and Connect APIs

Use `sdk.fetch?.()` for Salesforce REST APIs. Verify a response exists, then
check `response.ok` before decoding JSON. It handles base paths, CSRF and auth.
Use Apex REST when GraphQL cannot express business logic; implement server-side
sharing/CRUD/FLS independently of the SDK.

The newer [Access Salesforce APIs](https://developer.salesforce.com/docs/platform/multiframework/guide/data-sdk-connect.html)
page expands the introductory endpoint list:

| API family | Internal | External |
|---|---|---|
| `/services/apexrest/*`, `/graphql`, `/ui-api/*`, `/chatter/*` | Yes | Yes, subject to user/guest permissions |
| Session timeout, logout, file-upload config, UI telemetry | Yes | Yes |
| `/services/data/v{version}/connect/*` general Connect resources | Yes | Not listed generally |
| CMS channel contents and searchable-content-types endpoints | Supported through Connect | Specifically listed for external apps |

Consult that page and each feature's API documentation for Data 360, CRM Analytics,
Industries, CMS, or file upload rather than treating the old short list as an
exhaustive allowlist. Supported family does not grant data permissions or licenses.
Use SDK GraphQL POST normally; SDK fetch GraphQL GET is a documented special case.

The request-headers page documents defaults and runtime `Accept-Language` handling;
the introduction still says GraphQL response localization is unsupported. Do not
promise that setting a header localizes every GraphQL field. For locale-aware
rendering and custom labels use [platform-capabilities.md](platform-capabilities.md).

## Reusable helpers

[graphqlClient.ts](../assets/examples/graphqlClient.ts) supplies Strict/Tolerant
reads and an explicitly partial-result mutation helper. A helper returning only
`TData` discards query reactivity; retain `QueryResult` when subscriptions or
refresh matter. Choose error policy per operation, not by casting undefined data.
