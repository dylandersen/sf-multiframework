# Data SDK (`@salesforce/platform-sdk/data`)

> **GA rename + import subpath.** The Data SDK shipped during Beta as `@salesforce/sdk-data`. At GA you **install** the package `@salesforce/platform-sdk` and **import from its `/data` subpath**:
>
> ```ts
> import { createDataSDK, gql } from "@salesforce/platform-sdk/data";
> import type { DataSDK, SDKOptions, NodeOfConnection } from "@salesforce/platform-sdk/data";
> ```
>
> (The GA blog abbreviated the import as bare `@salesforce/platform-sdk`; the API reference consistently uses `@salesforce/platform-sdk/data`. Verify against your installed package.)
>
> Other GA changes: reads go through `.query()`, writes through `.mutate()`, `result.data` is typed as possibly `undefined`, queries are **reactive** (`subscribe()` / `refresh()`) and **cached** (shared across SDK instances with the same base URL). See [beta-to-ga-migration.md](beta-to-ga-migration.md).

The Data SDK is the **only** sanctioned way to call Salesforce APIs from a React UI bundle. It abstracts authentication, CSRF token management, and base-path resolution across surfaces (Lightning Experience, Experience Cloud sites, the local Vite dev server).

> Never call `fetch()` or `axios` directly to a Salesforce endpoint from a React UI bundle.

## Why use it

| Feature | Benefit |
|---|---|
| **Surface abstraction** | Same code works in App Launcher, Experience Cloud, and `localhost` dev |
| **Capability detection** | The SDK detects the runtime and picks the right transport |
| **TypeScript-first** | Full IntelliSense, compile-time safety, Promise-based error flow |
| **Auth + CSRF** | Handled internally — you don't manage tokens |

## Public API surface

All of the following are exported from `@salesforce/platform-sdk/data`:

| Export | Type | Purpose |
|---|---|---|
| `createDataSDK` | async function | Factory that returns a `DataSDK` instance |
| `gql` | template tag | Identity tag for inline GraphQL queries; enables editor highlighting and codegen detection |
| `DataSDK` | interface | The SDK surface — optional `graphql` (`DataSDKGraphQL`) and `fetch` |
| `DataSDKGraphQL` | interface | `query()` and `mutate()` methods |
| `SDKOptions` | interface | Base options type with optional surface override |
| `NodeOfConnection<T>` | utility type | Extracts node type from `{ edges { node ... } }` connection responses |

Supporting types (returned or accepted by the methods above):

```ts
interface DataSDK {
  graphql?: DataSDKGraphQL;
  fetch?: typeof fetch;
}

interface DataSDKGraphQL {
  query<T, V = Record<string, unknown>>(options: QueryOptions<V>): Promise<QueryResult<T>>;
  mutate<T, V = Record<string, unknown>>(options: MutateOptions<V>): Promise<MutationResult<T>>;
}

interface QueryOptions<V = Record<string, unknown>> {
  query: string;
  variables?: V;
  operationName?: string;      // for multi-operation documents
  cacheControl?: CacheControl; // see "GraphQL cache" below
}

interface MutateOptions<V = Record<string, unknown>> {
  mutation: string;            // NOTE: `mutation`, not `query`
  variables?: V;
  operationName?: string;
}

interface QueryResult<T> {
  data: T | undefined;         // possibly undefined — optional-chain it
  errors?: GraphQLError[];
  subscribe(cb: (snapshot: QuerySnapshot<T>) => void): Unsubscribe; // reactive
  refresh(): Promise<void>;    // re-issue, bypassing cache, notify subscribers
}

interface MutationResult<T> {  // one-shot: no subscribe/refresh
  data: T | undefined;
  errors?: GraphQLError[];
}

interface QuerySnapshot<T> { data: T | undefined; errors?: GraphQLError[]; }

interface GraphQLError {
  message: string;
  locations?: { line: number; column: number }[];
  path?: string[];
}

type Unsubscribe = () => void;
type CacheControl = "no-cache" | "only-if-cached" | { type: "max-age"; maxAge: number };
```

## `createDataSDK(options?)`

```ts
import { createDataSDK } from "@salesforce/platform-sdk/data";

const sdk = await createDataSDK({
  surface: "webapp",
  webapp: {
    basePath: "/my-experience-site",
    on401: () => signInAgain(),
    on403: () => showPermissionsHelp()
  }
});
```

Options shape:

```ts
type DataSDKOptions = {
  surface?: string;                          // for explicit surface detection
  webapp?: {
    basePath?: string;                       // URL prefix for SF API calls
    on401?: () => Promise<unknown> | void;   // optional 401 hook
    on403?: () => Promise<unknown> | void;   // optional 403 hook
  };
};
```

The 401/403 callbacks are essential for **Experience Cloud** apps where users may need to sign in again or be guided to permission setup.

## `sdk.graphql?.query()` and `sdk.graphql?.mutate()`

Reads and writes are separate methods as of GA. Each takes an options object, and the parameter key matches the operation type.

```ts
// Read
const res = await sdk.graphql?.query<MyQuery>({ query: QUERY, variables });

// Write
const res = await sdk.graphql?.mutate<MyMutation>({ mutation: MUTATION, variables });
```

Use **optional chaining** (`?.`) — `graphql` is not guaranteed in every surface.

> **Beta → GA:** the Beta funneled both reads and writes through a single generic `sdk.graphql?.({ query })` (or `sdk.graphql?.(QUERY, variables)`) call. That form is gone. Split every call into `.query()` / `.mutate()`.

GraphQL is the **preferred** path for record reads and writes.

### Reactive queries — `subscribe()` and `refresh()`

`query()` returns a **reactive** `QueryResult<T>`. Beyond the initial `data` / `errors`, it exposes:

- `subscribe(cb)` — streams subsequent snapshots (`{ data, errors }`) whenever the underlying data changes (e.g. after a `refresh()` or a cache update from another SDK instance). Returns an `Unsubscribe` function.
- `refresh()` — re-issues the request, bypassing the cache where one exists, and propagates the new result to all subscribers.

This is the React replacement for LWC's `@wire` reactivity: fetch once, then keep the UI live.

```ts
const result = await sdk.graphql?.query<AccountsQuery>({ query: LIST_ACCOUNTS });
render(result?.data);

// Keep the view live; clean up on unmount.
const unsubscribe = result?.subscribe(({ data, errors }) => {
  if (errors?.length) console.warn(errors);
  render(data);
});
// later: unsubscribe?.();

// Force a fresh fetch (e.g. after a mutation elsewhere):
await result?.refresh();
```

`mutate()` returns a one-shot `MutationResult<T>` — it has **no** `subscribe()` / `refresh()` and does not touch the cache. To refresh stale data after a mutation, call `refresh()` on the relevant *query* result.

### GraphQL cache and `cacheControl`

The GraphQL cache is **shared across all `DataSDK` instances that use the same base URL**. Multiple `createDataSDK()` calls share it, so a query from one instance can be served from cache to another (and cache updates are visible across instances). This improves performance and consistency when several components query the same data.

Key facts:

- **Default TTL is 300s (5 minutes).** With no `cacheControl`, the SDK uses `max-age` at 300s. A cache hit under 300s returns immediately; a stale entry (>300s) is treated as a cache miss and refetched.
- **Cache key is `{ query, variables, operationName }`.** `cacheControl` does **not** change the cache key — the same query+variables always shares one cache entry, regardless of the `cacheControl` value you pass.
- **`cacheControl` is web-app only** and is **ignored on uncached surfaces**.
- **Partial-success responses (both `data` and `errors`) are not cached** — every subsequent call re-fetches from the network.
- **Mutations never read or write the cache.**

Control per-query caching with `cacheControl` in `QueryOptions`:

| `cacheControl` value | Behavior |
|---|---|
| *(omitted)* | Default `max-age` of **300s** |
| `"no-cache"` | Revalidate with the origin before reusing a cached response; still **writes** the response back to cache (300s TTL) for later default callers. Use to force-refresh after a known mutation. |
| `"only-if-cached"` | Read from cache only, never hit the network. **Cache miss throws `DataNotFoundError`.** Good for offline-first / avoiding loading states when stale data is acceptable. |
| `{ type: "max-age", maxAge: <seconds> }` | Same as default but with your TTL. Use for frequently-changing data (dashboards, notifications). |

```ts
const res = await sdk.graphql?.query<AccountsQuery>({
  query: LIST_ACCOUNTS,
  cacheControl: { type: "max-age", maxAge: 60 },
});
```

> `maxAge` must be a **finite, non-negative** number. Invalid values (negative, `NaN`) silently fall back to 300s. `maxAge: 0` is valid and means "always stale" → refetch on every call.

### Defining queries

#### Inline with `gql` (simple)

```ts
import { createDataSDK, gql } from "@salesforce/platform-sdk/data";

const QUERY = gql`
  query SingleAccount {
    uiapi {
      query {
        Account(first: 1) {
          edges {
            node {
              Id
              Name { value }
              Industry { value }
            }
          }
        }
      }
    }
  }
`;
```

The `gql` tag is an identity template literal. It triggers:

- editor syntax highlighting (with Agentforce Vibes / GraphQL extensions)
- codegen detection
- runtime type-tagged operation registration

#### External `.graphql` file (complex / shared)

```
src/api/utils/query/singleAccountQuery.graphql
src/api/graphql-operations-types.ts          # generated
```

```ts
import QUERY from "./query/singleAccountQuery.graphql?raw";
import type { SingleAccountQuery, SingleAccountQueryVariables }
  from "../graphql-operations-types";
```

Use external files when the query has variables, fragments, or is shared across files. See [graphql-workflow.md](graphql-workflow.md) for the codegen pipeline.

### UI API response shape — every field is wrapped in `{ value }`

```ts
const res = await sdk.graphql?.query({ query: QUERY });
// result.data is possibly undefined as of GA — optional-chain the whole path.
const edges = res?.data?.uiapi?.query?.Account?.edges;

edges?.forEach(edge => {
  const acct = edge?.node;
  console.log(acct?.Name.value);       // "Acme Corp"
  console.log(acct?.Industry.value);   // "Technology"
});
```

This is **Salesforce-specific**. Standard GraphQL doesn't wrap fields. Comment this in code aimed at React-first developers.

### `NodeOfConnection<T>`

```ts
import type { NodeOfConnection } from "@salesforce/platform-sdk/data";
import type { ListAccountsQuery } from "../graphql-operations-types";

type AccountNode = NodeOfConnection<
  NonNullable<ListAccountsQuery["uiapi"]>["query"]["Account"]
>;

function renderRow(node: AccountNode) {
  return <tr><td>{node.Name.value}</td></tr>;
}
```

Use when:
- the response uses the `edges/node` connection shape
- you want a clean strongly-typed node alias for transforms / props / list rendering

Skip when your generated types are already flat / non-connection.

## `sdk.fetch?.()`

```ts
const res = await sdk.fetch?.(
  "/services/data/v67.0/ui-api/records/001xx0000000000",
  { method: "GET" }
);
```

Use for endpoints **not** covered by GraphQL. The wrapper handles:

- **CSRF token management**
- **Base path resolution** (so the same code works in dev, sandbox, Experience site)
- **401 / 403 callback hooks** registered in `createDataSDK` options

### Allow-listed endpoints

`sdk.fetch?.()` is supported for these endpoint shapes:

```
/services/apexrest/...
/services/data/v{version}/ui-api/records
/services/data/v{version}/ui-api/search-info
/services/data/v{version}/ui-api/layout
/services/data/v{version}/ui-api/session/csrf
/services/data/v{version}/connect/file/upload/config
/services/data/v{version}/connect/proxy/ui-telemetry
/services/data/v{version}/chatter/users/me
/services/data/v{version}/chatter/users/{userId}
/sfsites/c/_nc_external/system/security/session/SessionTimeServlet
/secur/logout.jsp
```

Anything outside this list is not guaranteed to work and should go through Apex REST instead.

### When to use `fetch` over GraphQL

- Apex REST endpoints exposing custom business logic GraphQL can't express.
- UI API REST endpoints not exposed via GraphQL (search-info, layout, chatter users, session/csrf).
- File upload bootstrap (`connect/file/upload/config`).
- GraphQL with a GET request (small queries with URL constraints, or when you specifically need a CSRF round-trip).

## Order of preference for data access

1. **GraphQL queries** via `sdk.graphql?.query()` and **mutations** via `sdk.graphql?.mutate()`
2. **UI API REST / Apex REST** via `sdk.fetch?.()`
3. **GraphQL with `sdk.fetch?.()` GET** for the niche cases above
4. **Apex REST** when GraphQL can't do it

## Anti-patterns

```ts
// ❌ NEVER — bypasses auth, CSRF, base path
const res = await fetch("/services/data/v67.0/ui-api/records/001...");

// ❌ NEVER — same problem
const res = await axios.get("/services/data/...");

// ❌ Beta call shape — the generic graphql() method no longer exists
const res = await sdk.graphql?.(QUERY, variables);

// ❌ Forgetting optional chaining — crashes in surfaces that don't expose graphql
const res = await sdk.graphql.query({ query: QUERY });

// ❌ Assuming result.data is present — it's possibly undefined as of GA
const edges = res.data.uiapi.query.Account.edges;

// ✅ Correct — split read/write, optional-chain the surface and the data
const res = await sdk.graphql?.query({ query: QUERY, variables });
const edges = res?.data?.uiapi?.query?.Account?.edges;
```

## Reference wrapper (`graphqlClient.ts`)

The `multiframework-recipes` repo uses a thin wrapper:

```ts
// src/api/graphqlClient.ts
import { createDataSDK } from "@salesforce/platform-sdk/data";
export { gql } from "@salesforce/platform-sdk/data";

export async function executeGraphQL<TData, TVars = Record<string, unknown>>({
  query,
  variables
}: {
  query: string;
  variables?: TVars;
}): Promise<TData> {
  const sdk = await createDataSDK();
  const response = await sdk.graphql?.query({ query, variables });

  if (!response) throw new Error("GraphQL surface unavailable");
  if (response.errors?.length && !response.data) {
    throw new Error(response.errors.map(e => e.message).join("; "));
  }
  return response.data as TData;
}

// Mutations use .mutate() with a `mutation` key:
//   const response = await sdk.graphql?.mutate({ mutation, variables });
```

This is a **Strict** error strategy. See [error-handling.md](error-handling.md) for Tolerant and Permissive variants.

## Current user (`uiapi.currentUser`)

There is no `@salesforce/user/Id` module. Read the running user through GraphQL:

```ts
const res = await sdk.graphql?.query({
  query: gql`
    query { uiapi { currentUser { Id Name { value } } } }
  `,
});
const me = res?.data?.uiapi?.currentUser;
```

## Coming from LWC — what to use instead

The Data SDK replaces the LWC-only data modules. There is no `@wire`, no `lightning/uiRecordApi`, and no `@salesforce/*` data imports other than `@salesforce/platform-sdk/data`.

| Don't use (LWC-only) | Use instead in React |
|---|---|
| `@salesforce/apex/Class.method` | `sdk.fetch?.()` against `/services/apexrest/...` |
| `@salesforce/schema/Object.Field` | Hardcode the API name as a string in the GraphQL query |
| `@salesforce/user/Id` | GraphQL `uiapi.currentUser` via `sdk.graphql?.query()` |
| `lightning/uiRecordApi` `get*` (`getRecord`, `getListUi`) | `sdk.graphql?.query()` |
| `lightning/uiRecordApi` mutations (`createRecord`, `updateRecord`, `deleteRecord`) | `sdk.graphql?.mutate()` |
| `@wire` decorator | `useEffect` + `sdk.graphql?.query()`; `QueryResult.subscribe()` for reactive updates |

## See also

- [graphql-workflow.md](graphql-workflow.md) — codegen and operation generation
- [error-handling.md](error-handling.md) — Strict / Tolerant / Permissive
- [Multi-Framework Recipes](https://github.com/trailheadapps/multiframework-recipes) — reference implementations
