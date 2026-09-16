Subject: [BUG REPORT] Hermes Provider-Switch Message Sanitization Failure — Sessions Poisoned on Model Switch

To: anuroopquestion7@gmail.com (for forwarding to Nous Research)

---

Hi Nous Research team,

I'm filing a bug report for Hermes Agent. The issue: switching LLM providers/models mid-session poisons the conversation history and breaks the session completely with HTTP 400 errors.

## Summary

When Hermes switches from one provider/model to another (manual or automatic fallback), provider-specific message properties like `reasoning_details` and `anthropic_content_blocks` are NOT stripped from the conversation history. The new provider's API rejects the request. The session becomes permanently broken.

## Error Traces

```
time: 2026-09-16T09:04:04.984Z
provider: groq
model: llama-3.3-70b-versatile
error: HTTP 400: 'messages.4' : property 'reasoning_details' is unsupported
```

```
time: 2026-09-16T09:04:10.891Z
provider: groq
model: llama-3.3-70b-versatile
error: HTTP 400: 'messages.4' : property 'reasoning_details' is unsupported
```

```
error: HTTP 400: 'messages.4' : property 'anthropic_content_blocks' is unsupported
```

## Reproduction

1. Start session on Claude (Anthropic) → messages get `anthropic_content_blocks`
2. Switch to Llama 3.3 (Groq) → HTTP 400, `anthropic_content_blocks` unsupported
3. Start session on reasoning-enabled model → messages get `reasoning_details`
4. Switch to non-reasoning model → HTTP 400, `reasoning_details` unsupported
5. ANY provider switch → poisoned history, session lost

## Impact

- Automatic fallback chain is BROKEN — fallback models always fail
- No session continuity — users lose all conversation history
- `retryable: true` is misleading — retrying never helps
- No in-product recovery — only fix is starting a new chat

## Proposed Fix

Sanitize conversation history before switching providers — strip provider-specific properties (`anthropic_content_blocks`, `reasoning_details`, `refusal`, etc.) while preserving actual message content and tool_calls.

## Environment

- OS: Windows 11
- Affected: Anthropic, Groq, Nous (any cross-provider switch)
- Models tested: Claude, Llama 3.3 70B, LongCat 2.0, Laguna S 2.1

Happy to provide more details or test patches. This is a high-severity bug for anyone using multi-provider setups.

— Anu (anuroopquestion7@gmail.com)
