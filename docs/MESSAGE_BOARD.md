# The Message Board

How notes get from a stranger's keyboard onto the cork board at `/board/`, and
what you have to do in between.

**Short version:** notes arrive as GitHub issues. Nothing appears on the site
until you add the `approved` label. You reply by commenting on the issue.

---

## The pipeline

```
   visitor fills the form at /board/
                 │
                 ├── endpoint mode ──▶ Cloudflare Worker ──┐
                 │                     (holds the token)   │
                 │                                         ▼
                 └── fallback mode ──▶ pre-filled ──▶  GitHub issue
                                       issue URL       label: board-post
                                                            │
                                    📱 you get a push notification
                                                            │
                                              you add label: approved
                                                            │
                                                            ▼
                                         .github/workflows/board-sync.yml
                                                            │
                                              scripts/sync-board.js
                                       (merges board-seed.json + issues)
                                                            │
                                                            ▼
                                            assets/data/board.json  ──▶ commit
                                                            │
                                            gh workflow run build-deploy.yml
                                                            │
                                                            ▼
                                              assets/js/board.js renders it
```

Every step after "you add the label" is automatic and takes about a minute.

---

## Moderation cheat sheet

You do all of this from the GitHub issue, on the web or in the mobile app.

| Action | Effect on the board |
|---|---|
| Add label **`approved`** | The note goes up |
| Remove `approved` | The note comes down |
| **Close** the issue | The note comes down (closed issues never render) |
| Reopen it | Back up, if `approved` is still on |
| Add label **`pinned`** | Sticks to the top, above the date-sorted notes |
| Add label **`style:flyer`** | Forces that paper style instead of a random one |
| **Comment** on the issue | Your words appear in red marker under the note |
| Comment starting with **`//`** | Internal, never published |
| Edit the issue body | The note's text updates on the next sync |
| Delete the issue | Gone everywhere |

Nothing here needs a terminal, a commit, or a laptop.

### Labels you need to exist

The sync queries issues by label, so these have to be real labels on the repo.
Create them once (Issues → Labels), or just add them by typing the name on the
first issue and letting GitHub offer to create it:

- `board-post` — applied automatically by the Worker / the pre-filled URL
- `approved` — the publish switch, applied by you
- `pinned` — optional
- `style:index`, `style:lined`, `style:sticky`, `style:napkin`,
  `style:receipt`, `style:flyer`, `style:card` — optional, create only the ones
  you use

If `approved` doesn't exist yet, the sync finds zero issues and the board
quietly shows only the seed notes. That's the symptom of a missing label.

### Replying

Comment on the issue. The first comment from a repo owner, member, or
collaborator becomes the reply on the note — anyone else commenting is ignored,
so drive-by comments from strangers can't put words on the board.

Start the comment with a name to sign it:

```
DeadBeat: Gord still owes us for the PA. Tell him we said hi.
```

Recognized signers: `DeadBeat`, `SnowMan`, `The Management`. Anything else is
treated as part of the reply text, not a signature.

Start a comment with `//` to keep it off the site entirely:

```
// this one is probably a bot, watch for more from this name
```

---

## Notifications

The Worker pushes to **ntfy.sh** the moment a note is submitted — before
moderation, before any sync. Free, no account, no email.

**Setup:**

1. Install **ntfy** (App Store / Play Store / F-Droid)
2. Subscribe to the topic — the value stored in the Worker's `NTFY_TOPIC` secret
3. `npx wrangler secret put NTFY_TOPIC` in `workers/board-inbox/`, then redeploy

The notification carries the note's text and the submitter's name, and tapping
it opens the GitHub issue so you can label it from the phone.

**The topic name is the only access control.** Anyone who knows it can read
your notifications and send you fake ones. Use a long random one, keep it in
the Worker secret and your phone, and don't put it in the repo. Rotate by
putting a new secret and re-subscribing.

**Not configured?** The Worker skips the notification and everything else works
normally. A failed push never fails a submission — the note is already on
GitHub before `notify()` runs.

### Why not GitHub's own notifications

Two reasons, both discovered the hard way:

1. **GitHub Mobile only pushes** direct mentions, assignments, review requests,
   and deployment approvals. A new issue in a watched repo reaches your GitHub
   inbox but never your lock screen.
2. **The issues are opened by our own token**, so GitHub sees them as your own
   activity and stays quiet regardless.

The GitHub inbox still fills up, and it's a perfectly good place to work through
a backlog. It just isn't a notification.

---

## Data files

Two files, and the difference matters.

### `assets/data/board-seed.json` — hand-authored, yours

Notes you write. Edited by hand, committed like any other content, **never
touched by the sync script**. Use it for the house rules, the running jokes,
anything you want permanently pinned. The board is never empty because of it.

### `assets/data/board.json` — generated, don't hand-edit

What the site actually fetches. Produced by `scripts/sync-board.js` as
`board-seed.json` + approved issues, sorted. Any manual edit here gets
overwritten the next time someone touches an issue.

Both use the same schema — see [DATA_SCHEMA.md](DATA_SCHEMA.md).

---

## Running the sync by hand

Normally the workflow does this. When you want to force it:

**From GitHub:** Actions → Sync Message Board → Run workflow.

**Locally:**

```bash
GITHUB_TOKEN=$(gh auth token) node scripts/sync-board.js
```

Without a token it runs unauthenticated — rate-limited and unable to read
comments, so replies go missing. Fine for checking the seed notes render,
useless for a real sync.

The script writes `board.json` only when the content actually changed, so
running it repeatedly produces no spurious commits.

There's also a daily cron (`17 6 * * *`) as a safety net in case a webhook
event is ever missed.

---

## The two submission modes

Set by one string, `BOARD_CONFIG.endpoint` in `assets/js/board.js`:

**Fallback mode (`endpoint: ''`, current default)**
The form validates the note, then opens a pre-filled GitHub issue in a new tab.
The visitor presses the green button to finish. Zero infrastructure, zero cost,
works today — but the visitor needs a GitHub account.

**Endpoint mode (`endpoint` set to a Worker URL)**
The form posts JSON straight to a Cloudflare Worker, which holds a scoped token
and opens the issue on the visitor's behalf. They never leave the site and need
no account. Setup is about ten minutes: see
[`workers/board-inbox/README.md`](../workers/board-inbox/README.md).

The moderation flow, the notifications, and everything downstream are identical
either way.

---

## Spam handling

Layered, cheapest first:

| Layer | Where | Always on? |
|---|---|---|
| Honeypot field | `assets/js/board.js` | Yes |
| 4-second dwell check | `assets/js/board.js` | Yes |
| Length + character sanitizing | Worker and sync script | Yes |
| Per-IP rate limit (3/hour) | Worker, needs a KV namespace | Optional |
| Turnstile | Worker, needs a secret | Optional |
| **Manual approval** | You | Always |

The last row is the one that matters. Spam that gets past everything else lands
in the issue list and stays there, invisible to the site, until you delete it.

**One thing to know:** submitted-but-unapproved notes are visible to anyone who
looks at the repo's issue list, because the repo is public. They aren't on the
site, but they aren't secret either. The privacy page says so plainly.

---

## Paper styles

Seven, picked deterministically from the note's `id` when nothing forces one —
the same note always looks the same, so the board doesn't reshuffle on reload.

| Style | Looks like |
|---|---|
| `index` | Manila index card, red rule |
| `lined` | Notebook paper, blue rule and margin |
| `sticky` | Yellow post-it with a curling corner |
| `napkin` | Bar napkin, scalloped edge |
| `receipt` | Register tape, monospace, torn bottom |
| `flyer` | Photocopied show flyer, typewriter face |
| `card` | Plain card stock |

Pin color, fastener (tack, tape, staple), and rotation are seeded the same way.
Force a style with a `style:` label on the issue, or a `"style"` field in
`board-seed.json`.

---

## Files

| File | Role |
|---|---|
| `src/board.njk` | The page: hero, form, junk strips, `#board-notes` |
| `assets/js/board.js` | Fetches `board.json`, renders notes, handles submit |
| `assets/css/board.css` | Cork wall, paper styles, fasteners, junk |
| `assets/data/board-seed.json` | Hand-authored notes |
| `assets/data/board.json` | Generated output the site reads |
| `scripts/sync-board.js` | Issues → `board.json` |
| `.github/workflows/board-sync.yml` | Runs the sync, commits, redeploys |
| `workers/board-inbox/worker.js` | Optional token-holding proxy |
| `src/contact.njk` | Redirect stub, `/contact/` → `/board/` |

---

## Troubleshooting

**A note is approved but not on the board.** Check Actions → Sync Message
Board for a failed run. Then confirm the issue is open, has both `board-post`
and `approved`, and isn't a pull request (PRs are filtered out).

**The sync ran and committed, but the site is unchanged.** The deploy step
dispatches `build-deploy.yml` explicitly, because a push made with
`GITHUB_TOKEN` does not trigger other workflows. If that step was skipped, the
commit step decided nothing changed. Check Actions for a `build-deploy` run
newer than the board commit.

**A reply isn't showing.** The commenter must be OWNER, MEMBER, or
COLLABORATOR on the repo, the comment must not start with `//`, and only the
first qualifying comment is used. Check with:

```bash
gh api repos/CuWilliams/durtnurs.github.io/issues/<n>/comments \
  --jq '.[] | {user: .user.login, assoc: .author_association}'
```

**The board is empty on the live site.** `board.json` failed to load. Check the
browser console and that `_site/assets/data/board.json` exists in the build.
The page shows an empty-state message rather than breaking.

**Everything's fine but I want it all gone.** Empty the `posts` array in
`board-seed.json`, remove `approved` from every issue, run the sync. The board
renders its empty state and nothing is lost.

---

*Last updated: September 15, 2026*
