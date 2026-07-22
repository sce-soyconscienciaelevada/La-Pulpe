# Feedback -> n8n -> Telegram/WhatsApp notification -- build SOP

**Status: not built yet.** The app side is fully ready and already deployed -- it fires a webhook on every feedback submission. This doc is everything needed to build the n8n side, whenever there's a session with n8n MCP loaded (`/mcp-toggle` -> enable n8n -> restart), or to hand-build it in the n8n UI directly.

## What already exists (app side, live)

`src/lib/notify.ts` -- on every `createFeedback()` call (`src/app/(dashboard)/feedback/actions.ts`), this fires a best-effort POST to whatever URL is in the `BARMGMT_NOTIFY_HOOK` env var. **That env var is currently unset**, so today this function silently no-ops (checked first line: `if (!url) return;`). Nothing needs to change in the app to turn this on -- just set the env var once the n8n workflow exists.

**Exact payload sent** (`POST`, `Content-Type: application/json`):
```json
{
  "type": "BUG",
  "title": "El boton de cerrar dia no funciona",
  "description": "Toque cerrar dia y no paso nada, tuve que recargar la pagina",
  "venueName": "La Pulpe",
  "source": "bar-management-feedback",
  "sentAt": "2026-07-22T16:30:00.000Z"
}
```
- `type` is one of `BUG | FEATURE_REQUEST | WORKAROUND | QUESTION | OTHER` (matches `FeedbackType` enum in `prisma/schema.prisma`).
- Note: the screenshot Pablo pasted (if any) is **not** included in this payload -- it's stored directly in Postgres as an encoded image string on `FeedbackItem.screenshotDataUrl`, deliberately left out of the webhook to keep the notification payload small and fast. If a Telegram message should include the screenshot, that needs a second step (fetch it via a new small read endpoint -- not built). **Simplest v1: text-only notification, screenshot viewed in-app.**
- Request has a 5-second abort timeout on the app side, and any failure (network, non-2xx, timeout) is silently swallowed -- a broken n8n webhook can never block Pablo's feedback from saving.

## What needs to be built (n8n side)

### 1. Webhook node
- Type: **Webhook** (trigger)
- HTTP Method: `POST`
- Path: anything memorable, e.g. `barmgmt-feedback`
- Response Mode: "Using 'Respond to Webhook' node" (so we control the 200 response explicitly)
- Once saved and activated, n8n gives you a **Production URL** -- this exact URL becomes `BARMGMT_NOTIFY_HOOK`.

### 2. Format message node
- Type: **Set** (or **Code**, either works) -- build a human-readable string from the incoming JSON body.
- Example (Set node, one field called `message`, expression):
  ```
  {{ "New feedback on Bar Management\n\n" + $json.body.venueName + " -- " + $json.body.type + "\n" + $json.body.title + "\n\n" + $json.body.description }}
  ```
  (Field access is `$json.body.X` if the Webhook node's default JSON parsing wraps the payload under `body` -- check the actual incoming shape in n8n's execution panel on the first test run; some n8n versions flatten it to `$json.X` directly.)

### 3. Send notification node -- pick ONE:

**Option A -- Telegram (recommended, simplest, already has precedent in this vault)**
- Type: **Telegram** -> Send Message
- Needs: a Telegram bot. If Joan doesn't want to reuse an existing bot, create one via **@BotFather** in Telegram (`/newbot`, follow the prompts, get a bot token).
- Needs: the **chat ID** to send to (Joan's own Telegram user/chat). Get it by having Joan message the new bot once, then calling the bot's `getUpdates` endpoint and reading the chat id from the response -- exact method already used for the portfolio contact-message feature elsewhere in this vault.
- n8n credential: add a Telegram credential with the bot token, select it in the node, set Chat ID, message = the `message` field from step 2.

**Option B -- WhatsApp (if Joan prefers, more setup)**
- Reuses the same Meta Graph API pattern as the vault's existing WA Notify Pipeline (approve action -> n8n webhook -> Meta Graph API -> WhatsApp message -- see memory `project_w2_deprioritized.md` for the exact node config already proven there). Needs a Meta WhatsApp Business API token + phone number ID, more setup than Telegram for the same result (a message to Joan's own phone). **Not recommended unless Joan specifically wants WhatsApp over Telegram** -- Telegram is faster to stand up and this is a low-stakes internal notification, not client-facing.

### 4. Respond to Webhook node
- Type: **Respond to Webhook**
- Response: `200`, body `{"ok": true}` -- doesn't matter what's returned, the app ignores the response body entirely, just needs a fast 2xx so the app's timeout never trips.

### 5. Wire it up in Vercel
Once the workflow is built and **activated** (n8n workflows must be turned on, not just saved):
```
vercel env add BARMGMT_NOTIFY_HOOK production
vercel env add BARMGMT_NOTIFY_HOOK preview
```
paste the n8n webhook's Production URL for both. Then redeploy (`vercel --prod` from `site/`) so the new env var is actually picked up -- same pattern as every other env var change this project has needed.

### 6. Test it for real
1. Log into the live app, go to Feedback, submit a test item.
2. Confirm the n8n workflow's execution log shows a successful run (check in the n8n UI).
3. Confirm Joan actually received the Telegram/WhatsApp message.
4. Delete the test feedback item afterward (title contains "QA" or similar, delete via a one-off script against the live DB -- same pattern used throughout this project's testing).

## Open decisions for whoever builds this
- Telegram vs WhatsApp (recommendation: Telegram, see above).
- Which n8n instance: Joan's existing agency instance works fine for this even though Bar Management is Joan's own separate product, not an agency client -- it's just an outbound webhook target, doesn't create any real coupling. A dedicated instance is not necessary for this scale. Confirm the current instance URL before use -- it has moved before.
- Whether to eventually include the screenshot in the notification (would need a small new endpoint, not built -- text-only first version is the pragmatic v1).
<!-- updated: 2026-07-22 13:08 -->
