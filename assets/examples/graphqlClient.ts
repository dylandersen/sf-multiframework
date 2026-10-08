/** One-shot helpers. Retain QueryResult directly when subscriptions/refresh are needed. */
import { createDataSDK } from "@salesforce/platform-sdk/data";
import type { MutateOptions, QueryOptions, MutationResult } from "@salesforce/platform-sdk/data";
export { gql } from "@salesforce/platform-sdk/data";

let sdkPromise: ReturnType<typeof createDataSDK> | null = null;
function getSdk() {
  if (!sdkPromise) {
    sdkPromise = createDataSDK({
      webapp: {
        onStatus: {
          401: () => { console.warn("Session expired (401)"); },
          403: () => { console.warn("Insufficient permissions (403)"); }
        }
      }
    }).catch(error => {
      sdkPromise = null;
      throw error;
    });
  }
  return sdkPromise;
}

export async function executeGraphQL<TData, TVars = Record<string, unknown>>(
  options: QueryOptions<TVars>
): Promise<TData> {
  const sdk = await getSdk();
  const response = await sdk.graphql?.query<TData, TVars>(options);
  if (!response) throw new Error("GraphQL surface unavailable");
  if (response.errors?.length) {
    throw new Error(response.errors.map(e => e.message).join("; "));
  }
  if (!response.data) throw new Error("No query data returned");
  return response.data;
}

export async function executeGraphQLTolerant<TData, TVars = Record<string, unknown>>(
  options: QueryOptions<TVars>
): Promise<TData> {
  const sdk = await getSdk();
  const response = await sdk.graphql?.query<TData, TVars>(options);
  if (!response) throw new Error("GraphQL surface unavailable");
  if (!response.data) throw new Error("No query data returned");
  if (response.errors?.length) console.warn("GraphQL partial errors:", response.errors);
  return response.data;
}

/** Preserve partial write data AND errors; caller must verify its operation's success field. */
export async function executeGraphQLPermissive<TData, TVars = Record<string, unknown>>(
  options: MutateOptions<TVars>
): Promise<MutationResult<TData>> {
  const sdk = await getSdk();
  const response = await sdk.graphql?.mutate<TData, TVars>(options);
  if (!response) throw new Error("GraphQL surface unavailable");
  if (!response.data) {
    throw new Error(response.errors?.map(e => e.message).join("; ") || "No mutation data returned");
  }
  return response;
}
