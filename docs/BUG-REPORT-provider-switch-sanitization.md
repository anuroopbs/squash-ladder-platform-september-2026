# Bug Report: Provider-Switch Message Sanitization Failure

**Project:** Hermes Agent  
**Component:** Provider/Model Runtime — Message Serialization  
**Severity:** High — causes complete session failure on model switch  
**Reproducibility:** 100% (every cross-provider model switch)  

---

## Summary

When Hermes switches from one LLM provider/model to another mid-session (manual switch or automatic fallback), the conversation history is passed to the new provider **without stripping provider-specific message properties**. The new provider's API rejects the request with `HTTP 400` because it encounters properties it doesn't recognize.

This makes **any provider switch fatal** — the session is poisoned and cannot recover without starting a new chat.

---

## Root Cause

Different LLM providers use different internal message formats. Some providers attach **provider-specific properties** to assistant messages:

| Provider | Property | Example |
|---|---|---|
| **Anthropic (Claude)** | `anthropic_content_blocks` | Tool use blocks, thinking blocks |
| **Groq (Llama)** | `reasoning_details` | Chain-of-thought reasoning metadata |
| **OpenAI (GPT)** | `refusal` | Content moderation refusal reason |

When Hermes serializes the conversation history for the new provider, it does **not** strip these provider-specific properties. The new provider's API sees an unknown property on `role:assistant` messages and rejects the entire request.

The error is **retryable: true** in the Hermes error payload, but retrying doesn't help — the poisoned history is still poisoned.

---

## Reproduction Steps

### Case 1: Anthropic → Groq (Llama)

1. Start session on **Claude (Anthropic)** — assistant messages get `anthropic_content_blocks` property
2. Switch to **Llama 3.3 (Groq)** — either manually or via fallback
3. Send any message
4. **Error:**
   ```
   HTTP 400: 'messages.4' : for 'role:assistant' the following must be satisfied
   [('messages.4' : property 'anthropic_content_blocks' is unsupported)]
   ```

### Case 2: Reasoning model → Non-reasoning model

1. Start session on a model that uses **reasoning_details** (e.g., Groq Llama with thinking enabled)
2. Switch to a model that doesn't support `reasoning_details`
3. Send any message
4. **Error:**
   ```
   HTTP 400: 'messages.4' : for 'role:assistant' the following must be satisfied
   [('messages.4' : property 'reasoning_details' is unsupported)]
   ```

### Case 3: Any provider → Different provider

Any time the conversation history contains messages formatted for Provider A, and Hermes routes to Provider B, the API rejects the history.

---

## Error Traces

### Trace 1
```
time: 2026-09-16T09:04:04.984Z
layer: provider
code: unknown
retryable: true
provider: groq
model: llama-3.3-70b-versatile
error: HTTP 400: 'messages.4' : for 'role:assistant' the following must be satisfied
[('messages.4' : property 'reasoning_details' is unsupported)]
```

### Trace 2
```
time: 2026-09-16T09:04:10.891Z
layer: provider
code: unknown
retryable: true
provider: groq
model: llama-3.3-70b-versatile
error: HTTP 400: 'messages.4' : for 'role:assistant' the following must be satisfied
[('messages.4' : property 'reasoning_details' is unsupported)]
```

### Trace 3 (from earlier session)
```
error: HTTP 400: 'messages.4' : for 'role:assistant' the following must be satisfied
[('messages.4' : property 'anthropic_content_blocks' is unsupported)]
```

---

## Expected Behavior

When switching providers, Hermes should:

1. **Sanitize the conversation history** — strip all provider-specific properties from messages before sending to the new provider
2. **Preserve the semantic content** — the actual text/tool calls must remain intact
3. **Log the sanitization** — emit a debug log showing which properties were stripped
4. **Continue the session seamlessly** — the user should not lose their conversation

## Actual Behavior

1. Hermes passes the raw conversation history to the new provider
2. The new provider's API rejects it with HTTP 400
3. The error is marked `retryable: true` but retrying doesn't help
4. The session is **permanently poisoned** — the only recovery is starting a new chat
5. All conversation context is lost

---

## Impact

- **Users cannot switch models mid-session** — a core feature of the multi-provider setup is broken
- **Automatic fallback is broken** — if the primary model rate-limits or errors, the fallback model also fails
- **Session continuity is lost** — users lose all conversation history and must start over
- **Confusing error messages** — the error mentions `messages.4` and property names that mean nothing to end users
- **No in-product recovery** — the user has no way to "clear and continue" without abandoning the session

---

## Proposed Fix

### Option A — Sanitize on provider switch (recommended)

In the provider-switch code path, add a message sanitizer that:

```python
def sanitize_messages_for_provider(messages: list[dict], target_provider: str) -> list[dict]:
    """Strip provider-specific properties before switching providers."""
    sanitized = []
    for msg in messages:
        clean = {
            "role": msg["role"],
            "content": msg.get("content"),
        }
        # Preserve tool_calls if present (standard OpenAI format)
        if "tool_calls" in msg:
            clean["tool_calls"] = msg["tool_calls"]
        # Strip known provider-specific properties
        for key in list(clean.keys()):
            if key.startswith("anthropic_") or key.endswith("_details") or key == "refusal":
                del clean[key]
        sanitized.append(clean)
    return sanitized
```

### Option B — Sanitize on every outbound request

More defensive: sanitize messages before every API call, not just on provider switch. Slightly more overhead but catches edge cases.

### Option C — Provider-agnostic message store

Store messages in a normalized format internally. Only add provider-specific formatting at the API boundary. This is the cleanest long-term solution but requires a larger refactor.

---

## Workaround (for users)

Until fixed, users must:

1. **Avoid switching providers mid-session** — pick one model and stick with it
2. **If errors appear, start a new chat** — the poisoned history cannot be recovered
3. **Set `retryable: false`** in config to prevent Hermes from retrying poisoned requests (if such an option exists)

---

## Environment

- **OS:** Windows 11
- **Hermes version:** (unknown — `hermes --version` not accessible from this session)
- **Affected providers:** Anthropic, Groq, Nous (any cross-provider switch)
- **Affected models:** Claude (Anthropic), Llama 3.3 (Groq), LongCat 2.0 (Nous), Laguna S 2.1 (Nous)

---

## Additional Context

This bug makes the multi-provider fallback feature effectively unusable. The whole point of having a fallback chain (e.g., Claude → Llama → LongCat) is that if one model fails, the session continues on another. With this bug, the fallback **always fails** because the conversation history is poisoned by the previous provider's format.

The `retryable: true` flag is misleading — it suggests the request will succeed on retry, but it won't because the input (conversation history) is structurally invalid for the target provider.

---

## Submission

- **GitHub Issues:** https://github.com/NousResearch/hermes-agent/issues/new
- **Discord:** Nous Research Discord — #support channel
- **Email:** security@nousresearch.com (for security-related issues)

**Filed by:** Anu (anuroopquestion7@gmail.com)  
**Date:** 2026-09-16
