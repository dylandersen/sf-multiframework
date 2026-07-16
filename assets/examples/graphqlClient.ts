/**
 * Strict-by-default GraphQL wrapper around the Data SDK.
 *
 * Use this for production code that wants type-safe call sites.
 * Recipes should use inline gql + sdk.graphql?.query() / .mutate() directly
 * so the lesson is visible in the recipe file.
 *
 * GA note: install @salesforce/platform-sdk and import from its /data subpath
 * (@salesforce/platform-sdk/data). Reads go through .query({ query }), writes
 * through .mutate({ mutation }), and response.data is possibly undefined.
 * query() results are reactive (subscribe/refresh) and cached; mutate() is not.
 *
 * Strategy variants (see references/error-handling.md):
 *   - Strict      — fail on any error
 *   - Tolerant    — log errors, return partial data
 *   - Permissive  — only fail when no data at all (mutations)
 */

import { createDataSDK } from "@salesforce/platform-sdk/data";
export { gql } from "@salesforce/platform-sdk/data";

let sdkPromise: ReturnType<typeof createDataSDK> | null = null;

function getSdk() {
  if (!sdkPromise) {
    sdkPromise = createDataSDK({
      webapp: {
        on401: () => {
          // Customize: refresh session, redirect to login, etc.
          console.warn("Session expired (401)");
        },
        on403: () => {
          console.warn("Insufficient permissions (403)");
        }
      }
    });
  }
  return sdkPromise;
}

export async function executeGraphQL<TData, TVars = Record<string, unknown>>({
  query,
  variables
}: {
  query: string;
  variables?: TVars;
}): Promise<TData> {
  const sdk = await getSdk();
  const response = await sdk.graphql?.query({ query, variables });

  if (!response) {
    throw new Error("GraphQL surface unavailable in this environment");
  }
  if (response.errors?.length) {
    throw new Error(response.errors.map((e: { message: string }) => e.message).join("; "));
  }
  return response.data as TData;
}

export async function executeGraphQLTolerant<TData, TVars = Record<string, unknown>>({
  query,
  variables
}: {
  query: string;
  variables?: TVars;
}): Promise<TData> {
  const sdk = await getSdk();
  const response = await sdk.graphql?.query({ query, variables });

  if (!response?.data) {
    throw new Error("No data returned");
  }
  if (response.errors?.length) {
    console.warn("GraphQL partial errors:", response.errors);
  }
  return response.data as TData;
}

export async function executeGraphQLPermissive<TData, TVars = Record<string, unknown>>({
  mutation,
  variables
}: {
  mutation: string;
  variables?: TVars;
}): Promise<TData> {
  const sdk = await getSdk();
  // Permissive is typically used for writes — call .mutate() with a `mutation` key.
  const response = await sdk.graphql?.mutate({ mutation, variables });

  if (!response) {
    throw new Error("GraphQL surface unavailable");
  }
  if (!response.data && response.errors?.length) {
    throw new Error(response.errors.map((e: { message: string }) => e.message).join("; "));
  }
  return response.data as TData;
}
