# Authenticated WebPhone chatbot webhook

Verified MAIN workflow: `5319a575-90d2-4894-9ece-355d9528b732`.
Published revision: `6f7a0c39-b815-4179-ba58-8775170ba702`.

Entry: POST `/webhook/webphone-chatbot`, Header Auth credential `WebPhone Chatbot Webhook`, response mode `responseNode`.
The header name and value are configured only in the server environment as `N8N_CHAT_AUTH_HEADER` and `N8N_CHAT_AUTH_VALUE`.
Set `N8N_CHAT_WEBHOOK_URL` to the reachable production webhook. Never put the secret in frontend configuration or Git.

Flow: Webhook -> Normalize HTTP Chat Input -> HTTP Chat Input Valid -> Normalize Input -> existing catalog/FAQ/quotation logic -> Build Conversation State -> Respond Chat JSON.
Invalid input uses Respond Invalid Chat Request (400). Malformed JSON is rejected by n8n (400/422).
`result_type=error` uses 502; pending variant selection is a normal 200 response, even with `success=false`.

The JS files preserve the reviewed quotation node implementations. They are not a complete workflow export and do not publish anything automatically.
The HTTP normalizer accepts both `conversationState` and `conversation_state`, preserves session identity and bounded history, and excludes request headers from downstream input.
Only Backend owns final pricing, official Quotation/Order creation, and authenticated PDF access. No legacy PDF upload/conversion nodes are used.

## Manual live checks

Run from `backend` after `npm run build`, with the local services and server-only Header Auth environment configured:

```powershell
node scripts/n8n-quotation/http-webhook-check.cjs
node --import tsx scripts/n8n-quotation/frontend-client-roundtrip.cjs
```

These are opt-in live checks, not npm mock tests. The first calls n8n and can write its pending-selection cache.
The second uses the real frontend API client and can create identifiable chat-history records through Backend.
Neither creates official Quotations, Orders, or Payments. The catalog-specific checks depend on current catalog variants and stock.
Previous measured results: 16 HTTP checks and 3 frontend-client roundtrip turns passed. Browser DOM verification was not performed.
