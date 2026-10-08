/** Employee Agent ACC mount. Supply authenticated host configuration; see acc-integration.md. */
import { useEffect, useRef, useState } from "react";
import { embedAgentforceClient } from "@salesforce/agentforce-conversation-client";

type Authentication =
  | { salesforceOrigin: string; frontdoorUrl?: never }
  | { frontdoorUrl: string; salesforceOrigin?: never };

type Props = Authentication & {
  agentId: string;
  agentLabel?: string;
  mode?: "floating" | "inline";
};

export function AccChatPanel({
  agentId, agentLabel, salesforceOrigin, frontdoorUrl, mode = "floating"
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let active = true;
    setError(null);
    setReady(false);
    try {
      embedAgentforceClient({
        container,
        salesforceOrigin,
        frontdoorUrl,
        agentforceClientConfig: {
          agentId,
          agentLabel,
          renderingConfig: { mode }
        },
        onReady: () => {
          if (active) setReady(true);
        },
        onError: () => {
          if (active) {
            setReady(false);
            setError("The agent connection failed. Check the session and agent access.");
          }
        }
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The agent could not load.");
    }
    return () => {
      active = false;
      container.replaceChildren();
    };
  }, [agentId, agentLabel, salesforceOrigin, frontdoorUrl, mode]);

  return (
    <>
      {error && <p role="alert">{error}</p>}
      {!ready && !error && <p role="status">Connecting to the agent…</p>}
      <div ref={containerRef} style={{ width: "100%", minHeight: mode === "inline" ? 480 : undefined }} />
    </>
  );
}
