/** Fetches the first Account; demonstrates UI API envelopes and explicit request states. */
import { useEffect, useState } from "react";
import { createDataSDK, gql } from "@salesforce/platform-sdk/data";

const QUERY = gql`
  query SingleAccount {
    uiapi {
      query {
        Account(first: 1) {
          edges { node { Id Name { value } Industry { value } BillingCity { value } } }
        }
      }
    }
  }
`;
interface AccountNode {
  Id: string;
  Name?: { value: string | null } | null;
  Industry?: { value: string | null } | null;
  BillingCity?: { value: string | null } | null;
}
interface AccountResponse {
  uiapi?: { query?: { Account?: { edges?: Array<{ node?: AccountNode | null } | null> | null } | null } };
}
type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty" }
  | { status: "loaded"; account: AccountNode };

export default function SingleRecord() {
  const [state, setState] = useState<State>({ status: "loading" });
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const sdk = await createDataSDK();
        const result = await sdk.graphql?.query<AccountResponse>({ query: QUERY });
        if (!result) throw new Error("GraphQL surface unavailable");
        if (result.errors?.length) throw new Error(result.errors.map(e => e.message).join("; "));
        if (!result.data) throw new Error("No query data returned");
        const connection = result.data.uiapi?.query?.Account;
        if (!connection?.edges) throw new Error("Account query returned no collection");
        const account = connection.edges.find(edge => edge?.node)?.node;
        if (active) setState(account ? { status: "loaded", account } : { status: "empty" });
      } catch (cause) {
        if (active) setState({ status: "error", message: cause instanceof Error ? cause.message : "Request failed" });
      }
    })();
    return () => { active = false; };
  }, []);
  if (state.status === "loading") return <div role="status">Loading…</div>;
  if (state.status === "error") return <div role="alert">{state.message}</div>;
  if (state.status === "empty") return <p>No accounts available.</p>;
  return <AccountTile account={state.account} />;
}

function AccountTile({ account }: { account: AccountNode }) {
  return (
    <article className="slds-card slds-p-around_medium">
      <h2 className="slds-text-heading_small">{account.Name?.value ?? "—"}</h2>
      <p>{account.Industry?.value ?? "Unknown industry"}</p>
      {account.BillingCity?.value && <p className="slds-text-body_small">{account.BillingCity.value}</p>}
    </article>
  );
}
