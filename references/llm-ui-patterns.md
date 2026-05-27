# LLM-Driven UI Patterns

When the React UI bundle drives Salesforce's Models API (or any LLM) through
an Apex REST endpoint — for example a custom "ask anything about my pipeline"
chat panel, an inline "draft this email" surface, or an agentic inspector —
the shape of the integration changes in ways that don't apply to plain GraphQL
recipes.

This page covers the patterns we use when the **server returns HTML or
structured JSON the LLM produced** and the **React app renders it without
re-validating the entire surface**.

> If you only need a pre-built chat widget that talks to an Employee Agent,
> use **Agentforce Conversation Client** instead — see
> [acc-integration.md](acc-integration.md). ACC owns the rendering, history,
> and styling for you. The patterns below apply when you want React to own
> the chrome and Apex to own the brain.

---

## 1) Multi-step Apex REST chat — one endpoint, action dispatcher

A single REST resource with an `action` body field beats one endpoint per
step. Lets you ship intent classification, query building, and final response
generation as separate round-trips without registering three URL mappings, and
lets React render progress between steps (`"Classifying…"` →
`"Building queries…"` → `"Analyzing…"`).

```apex
@RestResource(urlMapping='/myAiSurface/*')
global with sharing class MyAiSurfaceRestResource {
  @HttpPost
  global static void handle() {
    RestRequest req = RestContext.request;
    RestResponse res = RestContext.response;
    res.addHeader('Content-Type', 'application/json');

    Map<String, Object> body = (Map<String, Object>) JSON.deserializeUntyped(req.requestBody.toString());
    String action = stringField(body, 'action');
    Map<String, Object> result = new Map<String, Object>();
    try {
      switch on action {
        when 'classifyIntent' {
          result.put('intent', MyController.classifyIntent(
            stringField(body, 'userMessage'),
            stringField(body, 'conversationHistory')));
        }
        when 'buildQueries' {
          result.put('queryResult', MyController.buildQueries(/* … */));
        }
        when 'analyzeResults' {
          result.put('chatResult', MyController.analyzeResults(/* … */));
        }
        when else {
          result.put('error', 'Unknown action: ' + action);
          result.put('errorCode', 'BAD_ACTION');
        }
      }
    } catch (Exception e) {
      result.put('error', safeErrorMessage(e));
      result.put('errorCode', errorCodeFor(e));
    }
    res.responseBody = Blob.valueOf(JSON.serialize(result));
  }
}
```

React side — thin `post()` wrapper, optional chaining on the SDK:

```ts
// src/lib/aiSurface.ts
import { createDataSDK } from "@salesforce/sdk-data";

const REST_PATH = "/services/apexrest/myAiSurface";

async function post<T>(body: object, fallbackError: string): Promise<T> {
  const sdk = await createDataSDK();
  const res = await sdk.fetch?.(REST_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res?.ok) throw new Error(`${fallbackError} (HTTP ${res?.status ?? "?"})`);
  const data = await res.json();
  if (data?.error) throw new Error(data.error);
  return data as T;
}

export const classifyIntent = (args: { userMessage: string; conversationHistory: string }) =>
  post<{ intent: IntentResult }>({ action: "classifyIntent", ...args }, "Failed to classify intent");
// …same for buildQueries, analyzeResults
```

Why an action dispatcher and not separate `@HttpPost` paths:

- One `@RestResource` annotation, one `urlMapping`, one CSP rule.
- Adding a new step is one Apex `when` clause, no metadata change.
- Standardized `{ errorCode, error }` envelope across all steps.
- Easy to centralize audit context (`setRequestContext` / `clearRequestContext`).

---

## 2) Opaque server-state round-trip

The middle step of the chat workflow returns a serialized blob that React
**ships back unmodified** to the next step. The React app does not parse
its schema; it's the server's internal state.

```ts
// React: get the executionDataJson from buildQueries…
const qr = await buildQueries({ userMessage, conversationHistory, modelName });
// …and pass it straight to analyzeResults without inspecting it.
const cr = await analyzeResults({
  executionDataJson: qr.executionDataJson ?? "",
  userMessage,
  conversationHistory,
  modelName,
});
```

Apex side wraps three different shapes into the same `executionDataJson`
envelope so `analyzeResults` can branch:

```jsonc
// shape A: real data, route to Pass 2 LLM
{ "executionData": { "queryResultsText": "…", "recordLinks": { … }, "hasAnyResults": true } }

// shape B: failure card, render verbatim, skip LLM
{ "isFailureExplanation": true, "html": "<h2>…</h2>", "suggestions": ["…"] }

// shape C: pre-built result from a deterministic create/update path
{ "isCreateResult": true, "chatResult": { "response": "<h2>…</h2>", "suggestions": [] } }
```

Benefits:

- React knows the *outer* shape (a string blob) but never the inner schema.
- Backend can evolve internal representation without touching the React app.
- A single React render path handles success, graceful failure, and a
  deterministic deflection without three different branches in TypeScript.

This pattern composes well with the **fast path** — when the answer is
"here are the records you asked for", `buildQueries` can return a
`directResponse` HTML string that React renders immediately, bypassing the
Pass 2 LLM call entirely.

---

## 3) Conversation history with structured workspace state

Send the last N turns back to the server on every call so the LLM can resolve
follow-ups ("yes", "draft an email", "what about that May deal?"). Two parts:
plain prior turns + a structured `[WORKSPACE_STATE: {…}]` block carrying what
the React app currently shows.

```ts
// src/lib/conversationHistory.ts
export function buildConversationHistory(messages: ConversationMessage[]): string {
  const recent = messages.slice(-10);
  const parts: string[] = [];
  for (const m of recent) {
    if (m.isThinking) continue;
    const role = m.role === "user" ? "User" : "Agent";
    // Strip HTML from prior assistant turns — the LLM doesn't need to
    // re-render its own markup, and keeping it bloats the prompt.
    const text = m.role === "assistant" ? stripHtml(m.content) : m.content;
    parts.push(`${role}: ${text.slice(0, 1200)}`);
  }
  // The workspace state block lets the agent resolve pronouns like
  // "their open cases" or "draft an email" without re-asking. Apex
  // parses this back out via regex; keep the format stable.
  const state = buildWorkspaceState();
  if (state) parts.push(`[WORKSPACE_STATE: ${JSON.stringify(state)}]`);
  return parts.join("\n");
}

function buildWorkspaceState() {
  return {
    activeRecordIds: getOpenRecordIds(),     // currently inspected records
    activePage: location.pathname,            // pipeline / accounts / etc.
    lastAssistantOffers: extractLastOffers(),// "want me to draft an email?"
  };
}
```

Apex side parses `[WORKSPACE_STATE:` with a simple regex and feeds the
result into the intent classifier so a bare "yes" can route correctly:

```apex
public static WorkspaceState parseWorkspaceState(String history) {
  Matcher m = Pattern.compile('\\[WORKSPACE_STATE:\\s*(\\{.*?\\})\\]').matcher(history);
  if (!m.find()) return null;
  try {
    return (WorkspaceState) JSON.deserialize(m.group(1), WorkspaceState.class);
  } catch (Exception ignore) {
    return null;
  }
}
```

---

## 4) Rendering LLM-generated HTML safely — `SafeHtml` + a tag whitelist

The server returns rich HTML (`<h1>`, `<ul>`, `<table>`, `<a href="/lightning/r/...">`).
React must render it as HTML, not text — but with `dangerouslySetInnerHTML`
naked you've shipped an XSS vector.

```tsx
// src/SafeHtml.tsx
import { memo, useMemo } from "react";
import DOMPurify from "isomorphic-dompurify";

// Allowlist that matches what our Apex prompt teaches the LLM to emit.
// Anything not in here is stripped. Keep this tight — every tag added
// is a potential XSS surface in a chat bubble.
const ALLOWED_TAGS = [
  "p", "br", "strong", "b", "em", "i", "u", "s",
  "blockquote",
  "ul", "ol", "li",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "hr",
  "table", "thead", "tbody", "tr", "th", "td",
  "code", "pre",
  "a", "span", "div",
];
const ALLOWED_ATTR = ["href", "title", "class", "data-record-id"];

export const SafeHtml = memo(function SafeHtml({ html }: { html: string }) {
  // useMemo: sanitization is cheap per call but expensive when a long
  // chat scrolls and re-renders every bubble on every keystroke in the
  // composer. Memoized by html string identity.
  const clean = useMemo(
    () => DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR }),
    [html],
  );
  return <div className="ai-html" dangerouslySetInnerHTML={{ __html: clean }} />;
});
```

Why `memo` + `useMemo`:

- Long chat threads re-render every bubble on every parent state change.
- Without `memo` each `<SafeHtml>` instance re-runs DOMPurify on every
  parent render — adds up fast on conversations with 20+ assistant turns.
- The HTML strings rarely change once a turn is committed, so identity
  memoization works extremely well.

---

## 5) Lightning record links inside server-returned HTML

When the LLM (or your direct-response builder) emits record links, use
**absolute Lightning paths** so they navigate inside the same frame the app
is hosted in:

```html
<a href="/lightning/r/Account/001D700001caEjGIAU/view"><b>Mariner Bank</b></a>
```

Do NOT use full origin URLs (`https://yourorg.lightning.force.com/lightning/r/...`)
because:

- In an **internal AppLauncher app**, the React app already lives inside the
  Lightning frame; relative paths route correctly without a top-frame jump.
- In an **Experience Cloud app**, the absolute path is rewritten by the
  Salesforce frame; a hard-coded production origin breaks sandbox/scratch.

Two patterns to keep these links clickable through `SafeHtml`:

```ts
// 1. Allow href on <a> in the sanitizer (already shown above).
const ALLOWED_ATTR = ["href", "title", "class", "data-record-id"];

// 2. Optionally intercept the click in React to route via react-router
//    instead of letting the browser do a hard navigation — useful when
//    your app shell renders nested record inspectors.
function ChatBubble({ html }: { html: string }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={(e) => {
        const target = (e.target as HTMLElement).closest("a");
        if (!target) return;
        const href = target.getAttribute("href");
        if (href?.startsWith("/lightning/r/")) {
          // Open the inspector panel instead of leaving the page
          const [, , objectApiName, recordId] = href.split("/");
          if (objectApiName && recordId) {
            e.preventDefault();
            openInspector(objectApiName, recordId);
          }
        }
      }}
    >
      <SafeHtml html={html} />
    </div>
  );
}
```

---

## 6) `<SUGGESTIONS>` and `<CHART>` blocks — out-of-band structured payloads

When the LLM needs to return both rich HTML AND a structured payload (chart
data, follow-up suggestion chips), embed the structured payload as a fenced
block the Apex side extracts BEFORE returning to React:

```text
<h1>Pipeline Snapshot</h1>
<p>You have <b>12 open deals</b> totalling <b>$2.4M</b>.</p>
<table>…</table>

<SUGGESTIONS>["Show only Commit deals", "What's pushed this quarter?", "Draft a forecast call note"]</SUGGESTIONS>
<CHART>{"chartType":"horizontalBar","items":[{"label":"Commit","value":12},{"label":"Best Case","value":7}]}</CHART>
```

Apex strips the fenced blocks out of the HTML before returning, and surfaces
them as separate fields on the response shape:

```ts
export type ChatResult = {
  response?: string;            // HTML, blocks removed
  suggestions?: string[];       // parsed from <SUGGESTIONS>
  chart?: ChartData;            // parsed from <CHART>
  recordTabs?: RecordTab[];
};
```

This keeps the prompt single-pass (the LLM emits everything in one call)
while letting React render each piece in its proper UI affordance.

---

## 7) Streaming progress without SSE

The Models API in this Beta path is synchronous per call. Don't fake
streaming — instead show progress between the three multi-step calls:

```tsx
const [status, setStatus] = useState<string>("");

setStatus("Reading your question…");
const intent = await classifyIntent({ userMessage, conversationHistory });

setStatus(`Developing a plan to ${intent.intent.toLowerCase()}…`);
const qr = await buildQueries({ userMessage, conversationHistory, modelName });

setStatus(intent.intent === "QUERY" ? "Querying Salesforce…" : "Drafting response…");
const cr = await analyzeResults({ executionDataJson: qr.executionDataJson, … });
```

Each network round-trip becomes a UI progress step. With three steps you get
~2-6 seconds of perceived activity, which beats one 10-second spinner.

---

## 8) "Fast path" — skip Pass 2 when the answer is just records

When the LLM's first SOQL pass returns a simple list ("show my open
opportunities"), the *best* response is a deterministic table, not a Pass 2
LLM narrative. Render it server-side:

```apex
String fastPathHtml = tryBuildDirectResponse(intent, executions, recordTabs, userMessage);
if (String.isNotBlank(fastPathHtml)) {
  result.directResponse = fastPathHtml;
  result.directSuggestions = suggestNextStepsFromTabs(recordTabs);
}
```

React honors `directResponse` by **skipping `analyzeResults`** entirely:

```ts
const qr = await buildQueries(/* … */);
if (qr.directResponse) {
  // No Pass 2 call — the server already wrote the HTML.
  return { html: qr.directResponse, suggestions: qr.directSuggestions };
}
const cr = await analyzeResults({ executionDataJson: qr.executionDataJson, … });
return { html: cr.response, suggestions: cr.suggestions };
```

Eligibility (server-side decision):

- Intent is `QUERY` (not `COMPOSE`/`COMPARE`/`CREATE`/`UPDATE`)
- The plan does **not** mention overview/summary/analyze/draft
- Total surfaced rows across all tabs ≤ 25
- At least one record tab populated
- No aggregate-style purpose label on any execution

Wins: ~1.5-3 seconds removed per "list me X" question, lower model spend,
zero hallucination surface for the case where the data IS the answer.

---

## 9) Honest failure copy

When the server can't fulfill the request, the chat bubble copy should
distinguish between four root causes, not blame the user with a generic
"too broad" message:

| Bubble header | When |
|---|---|
| **AI service unavailable** | Models API exception, generation error, or einstein/model invocation error |
| **Couldn't find &lt;named entity&gt;** | Classifier extracted entities but every rescue tier returned 0 rows |
| **Data couldn't be rendered** | Reasoning succeeded but a downstream `SObjectException` or `was retrieved via SOQL` ate the response |
| **Query didn't run** | `MALFORMED_QUERY` or other SOQL syntax error from the LLM |

This is implemented in `handleBuildQueriesException` in the controller; the
React side renders the failure HTML via the same `SafeHtml` component used
for success responses. Suggestions stay generic ("Show me my top open
opportunities ranked by amount") so they never leak demo-org names into a
real customer org.

---

## 10) Apex defensive patterns React relies on

The React side cannot recover from an Apex exception — it only sees the
`{ errorCode, error }` envelope. To keep the chat usable when the LLM
returns weird SOQL, wrap each downstream enrichment helper in its own
try/catch on the Apex side so one helper crash doesn't sink the whole turn:

```apex
Set<Id> allOppIds = new Set<Id>();
Map<String, List<SObject>> supplementaryRecords = new Map<String, List<SObject>>();
try { allOppIds = MyQueryService.collectAllOppIds(executions); }
catch (Exception ex) { System.debug(LoggingLevel.WARN, 'collectAllOppIds: ' + ex.getMessage()); }
try { supplementaryRecords = MyQueryService.runSupplementaryQueries(executions, objectsWithRecords); }
catch (Exception ex) { System.debug(LoggingLevel.WARN, 'runSupplementaryQueries: ' + ex.getMessage()); }
```

Also: never call `SObject.get(fieldName)` directly on an LLM-produced result
row — it throws `SObjectException` when the LLM omitted the field from the
SELECT. Use a safe accessor:

```apex
public static Object safeField(SObject rec, String apiName) {
  if (rec == null || String.isBlank(apiName)) return null;
  Map<String, Object> populated = rec.getPopulatedFieldsAsMap();
  return populated == null ? null : populated.get(apiName);
}
```

These are Apex-side patterns, but they directly affect what the React app
sees: with them, "the LLM forgot to select WhatId" stays a debug log; without
them, it becomes a user-facing **"Unable to retrieve data"** chat bubble.

---

## Anti-patterns

### ❌ Calling Models API directly from React
The Models API is callable only from Apex (and select Flow / Agentforce
contexts). React must always go through your `@RestResource` Apex endpoint.

### ❌ Trusting the LLM's HTML without sanitization
Even with a tight system prompt, an LLM can be coaxed into emitting `<script>`,
`<iframe>`, or `<img onerror>`. Always sanitize with an allowlist.

### ❌ Embedding API keys in the React bundle
The Salesforce session handles auth via the Data SDK. There is no separate
API key for Models API on the React side — if you find yourself looking for
one, you're bypassing the Apex layer.

### ❌ Long-polling the Models API from React
Salesforce's Models API is request/response only in the Beta path. Don't
build a fake "streaming" UX by polling the same endpoint — use the
multi-step pattern in section 1 instead.

### ❌ Caching the LLM response in localStorage
Tempting for "instant feel" on reloads, but the org's data changes underneath
you. Cache UI preferences (collapse state, last tab) but never the AI
response itself.

### ❌ Branching the React rendering on `executionDataJson` shape
React must only check the outer envelope. Branching on the inner schema
welds the React app to the Apex internals and breaks every backend change.

---

## Cross-skill orchestration

| Task | Delegate to |
|---|---|
| Build the Apex REST resource + reasoning loop | [sf-apex](../../sf-apex/SKILL.md) |
| Wire up Agentforce Models API or Prompt Templates | [sf-ai-agentforce](../../sf-ai-agentforce/SKILL.md) |
| Use Agentforce Conversation Client (pre-built chat widget) | [acc-integration.md](acc-integration.md) |
| SOQL helpers for the reasoning engine | [sf-soql](../../sf-soql/SKILL.md) |
| Auditing / logging the model invocations | [sf-apex](../../sf-apex/SKILL.md) |
