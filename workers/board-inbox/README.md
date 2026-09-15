# Board Inbox Worker

A Cloudflare Worker that takes a note from the form at `/board/` and opens a
GitHub issue for it.

**It is optional.** The board works without it — see
[Two modes](#two-modes) below. Deploy this only when you want visitors to post
without needing a GitHub account of their own.

---

## Two modes

The board picks its mode from a single string, `BOARD_CONFIG.endpoint` in
[`assets/js/board.js`](../../assets/js/board.js):

| `endpoint` | Mode | What the visitor does | Setup |
|---|---|---|---|
| `''` (default) | **Fallback** | Form opens a pre-filled GitHub issue in a new tab; they press the green button | None |
| Worker URL | **Endpoint** | Form posts straight to the Worker; they never leave the site | This README |

Both modes end in the same place: a GitHub issue labelled `board-post`, which
is where moderation and notifications happen. See
[`docs/MESSAGE_BOARD.md`](../../docs/MESSAGE_BOARD.md).

---

## Deploying

### 1. Create the token

A fine-grained personal access token, scoped as tightly as it goes:

1. GitHub → Settings → Developer settings → **Fine-grained tokens** → Generate new token
2. **Repository access:** Only select repositories → `CuWilliams/durtnurs.github.io`
3. **Permissions:** Repository permissions → **Issues: Read and write**. Nothing else.
4. **Expiration:** pick a date you'll actually remember. When it lapses the
   Worker starts returning "Could not pin it up" and the fix is step 2 below
   with a fresh token.

The token can open issues on one repo. That is the entire blast radius if it
leaks.

### 2. Push the secret and deploy

```bash
cd workers/board-inbox
npx wrangler login                        # first time only
npx wrangler secret put BOARD_GITHUB_TOKEN  # paste the token, it is never written to disk
npx wrangler deploy
```

Wrangler prints the deployed URL, something like
`https://board-inbox.<your-subdomain>.workers.dev`.

Add the optional push notification now or later — see
[Optional: extra push channels](#optional-extra-push-channels).

**Never put the token in `wrangler.toml`.** That file is committed. Secrets go
through `wrangler secret put` only.

### 3. Point the site at it

In [`assets/js/board.js`](../../assets/js/board.js):

```javascript
const BOARD_CONFIG = {
  endpoint: 'https://board-inbox.<your-subdomain>.workers.dev',
  ...
```

Commit, push, and the normal Pages deploy takes it live. The form's
"you'll need a GitHub account" note removes itself once `endpoint` is set.

### 4. Check it

Post a note through the live form. Within a second or two an issue titled
`Board note from <name>` should appear in the repo's issue list, labelled
`board-post`. It will not be on the board yet — nothing publishes until you add
the `approved` label.

---

## What the Worker does

```
POST /  { "name": "...", "message": "..." }

  ├─ OPTIONS              → 204 with CORS headers
  ├─ not POST             → 405
  ├─ wrong Origin         → 403, no CORS headers at all
  ├─ no BOARD_GITHUB_TOKEN→ 500 "Board is not configured"
  ├─ unparseable body     → 400 "Send JSON"
  ├─ honeypot filled      → 200 {ok:true}, silently discarded
  ├─ empty message        → 400
  ├─ Turnstile fails      → 403   (only when TURNSTILE_SECRET is set)
  ├─ over rate limit      → 429   (only when BOARD_KV is bound)
  ├─ GitHub rejects       → 502 "Could not pin it up", real error logged server-side
  └─ success              → 201 {ok:true}
```

Only `https://durtnurs.com` and `https://www.durtnurs.com` are allowed origins
(`CONFIG.allowedOrigins` in [`worker.js`](worker.js)). A request from anywhere
else gets no CORS headers, so a browser on another site can't read the
response even if it fires the request.

Name and message are clamped to 40 and 600 characters and stripped of angle
brackets and control characters before they reach GitHub. Those limits must
stay in sync across three files:

- `BOARD_CONFIG` in `assets/js/board.js`
- `CONFIG` in `workers/board-inbox/worker.js`
- `CONFIG` in `scripts/sync-board.js`

GitHub API errors are logged with `console.error` (visible in
`npx wrangler tail`) and never returned to the visitor — an error body from
GitHub can echo back token details.

---

## Optional: extra push channels

**You probably don't need this.** Phone notifications already arrive through
`.github/workflows/board-notify.yml`, which @-mentions you on every new note —
the one thing GitHub Mobile will actually push. Nothing to install, no quota,
no third party. See `docs/MESSAGE_BOARD.md`.

Set one of these only if you'd rather the note landed in an app you already
live in. Each switches itself on by the presence of its secret.

### Telegram

1. Message [@BotFather](https://t.me/BotFather) → `/newbot` → copy the token.
2. Send your new bot any message, then read your chat id from
   `https://api.telegram.org/bot<TOKEN>/getUpdates` (the `chat.id` field).
3. ```bash
   npx wrangler secret put TELEGRAM_BOT_TOKEN
   npx wrangler secret put TELEGRAM_CHAT_ID
   npx wrangler deploy
   ```

### Discord

Server Settings → Integrations → Webhooks → New Webhook → Copy URL.

```bash
npx wrangler secret put DISCORD_WEBHOOK_URL
npx wrangler deploy
```

The URL *is* the credential — anyone holding it can post to your channel.

### ntfy.sh — supported, but don't

`NTFY_TOPIC` still works and is left in for completeness, but it cannot be
relied on from here. Anonymous publishing to ntfy.sh is rationed at **250
messages per day per source IP**, and a Cloudflare Worker's egress IP is shared
with every other Worker on the platform. Strangers exhaust the quota and you
get an intermittent `429` and silence — which is exactly how this was
discovered. Their paid tiers start at $6/month.

Telegram and Discord meter per *token*, so nobody else can spend your
allowance. That's the difference that matters.

### How it behaves

All configured channels fire in parallel through `ctx.waitUntil()` after GitHub
accepts the issue, and are settled independently. So:

- the visitor's confirmation never waits on a notification
- a dead channel never costs you a note
- one broken channel never silences the others

Failures are logged. `[observability]` is on in `wrangler.toml`, so check them
with `npx wrangler tail` or in the Cloudflare dashboard.

**Why GitHub's own notifications aren't enough on their own:** GitHub Mobile
only pushes direct mentions, assignments, review requests, and deployment
approvals — a new issue in a watched repo doesn't reach the phone. And in
endpoint mode the issues are opened by your own PAT, so GitHub reads them as
your own activity and stays silent. Hence the mention from a bot.

---

## Optional: rate limiting

Without a KV namespace the Worker accepts everything that passes the other
checks. With one it allows **3 notes per IP per hour**.

```bash
npx wrangler kv namespace create BOARD_KV
```

Wrangler prints an id. Uncomment the block in
[`wrangler.toml`](wrangler.toml), paste the id in, and redeploy:

```toml
[[kv_namespaces]]
binding = "BOARD_KV"
id = "the-id-wrangler-printed"
```

Free tier covers 100,000 KV reads and 1,000 writes per day. A board this busy
would be a bigger problem than the writes.

## Optional: Turnstile

Cloudflare's captcha-that-usually-isn't-a-captcha. Free, unlimited.

1. Cloudflare dashboard → Turnstile → add a widget for `durtnurs.com`
2. `npx wrangler secret put TURNSTILE_SECRET` with the **secret** key
3. Add the widget script and `<div class="cf-turnstile" data-sitekey="...">`
   to the form in [`src/board.njk`](../../src/board.njk), and send the token as
   `turnstileToken` in the POST body in `handleSubmit()`

The Worker only verifies when `TURNSTILE_SECRET` exists, so step 3 without
step 2 is harmless and step 2 without step 3 blocks every post. Do them
together or not at all.

The form already runs a honeypot field and a 4-second dwell check client-side,
which handles the low-effort bots. Add Turnstile if something gets past those.

---

## Cost

| | Free tier | Realistic use |
|---|---|---|
| Worker requests | 100,000/day | a handful |
| KV writes | 1,000/day | one per note |
| Turnstile | unlimited | — |
| GitHub issues | unlimited on public repos | one per note |

Nothing here bills. If the Worker ever exceeds the free tier, it stops serving
rather than charging.

---

## Troubleshooting

**"Board is not configured" (500)** — `BOARD_GITHUB_TOKEN` isn't set on the
deployed Worker. `npx wrangler secret list` to confirm, then step 2 above.

**"Could not pin it up" (502)** — GitHub refused. Run `npx wrangler tail` and
submit again; the real status and body are in the log. Usually an expired
token or one missing the Issues write permission.

**"Not allowed from here" (403)** — the request's Origin isn't in
`CONFIG.allowedOrigins`. Local dev at `localhost:8080` hits this by design;
test against the live site, or add the origin temporarily and remove it before
committing.

**Nothing happens, console shows a CORS error** — same cause as above. The
Worker deliberately returns no CORS headers to unknown origins.

**Posts succeed but nothing appears on the board** — working as intended. Add
the `approved` label to the issue. See
[`docs/MESSAGE_BOARD.md`](../../docs/MESSAGE_BOARD.md).

---

## Taking it back down

Set `BOARD_CONFIG.endpoint` back to `''` and push. The board returns to
fallback mode and keeps working. Then, if you want it gone:

```bash
npx wrangler delete
```

Revoke the PAT on GitHub afterward.
