# Fan Club Access Code Documentation

**Current Access Code:** `KRAKEN`

## Purpose

This code provides access to the Fan Club protected area at https://durtnurs.com/fanclub.html

The Fan Club is a password-protected section for approved fans with exclusive content including:
- Full photo and video gallery (all items, including non-public)
- Direct contact emails for band members (DeadBeat and SnowMan)
- Behind-the-scenes content and member-exclusive messaging
- Photos and videos not available in the public gallery

## Security Level: **Casual Gatekeeping**

### What This Is

This is **intentional client-side casual gatekeeping** for a private hobby band website among close friends. The access code is visible in the JavaScript source code (`assets/js/fanclub-auth.js`) to anyone who views it.

**This is expected behavior and completely acceptable for this use case.**

### What This Is NOT

- ❌ Secure authentication
- ❌ Protection against anyone who views page source
- ❌ Protection against developers using browser inspector
- ❌ Fort Knox

### Why This Approach Works

- ✅ Creates "members only" feeling for close friends
- ✅ Prevents casual visitors from stumbling upon private content
- ✅ Prevents search engines from indexing (via robots.txt + meta tags)
- ✅ Simple to manage and share with approved fans
- ✅ No database, no server-side authentication needed
- ✅ Perfect for static GitHub Pages hosting

### For Real Security

If you needed to protect sensitive information, you would use:
- Server-side authentication with password hashing
- Database to store user credentials
- HTTPS encryption (already have via GitHub Pages)
- Session management with secure tokens
- Services like Cloudflare Access, Auth0, or similar

But for a hobby band website among friends? Client-side gatekeeping is perfect.

## Distribution

Share this code **privately** with approved fans via:
- ✅ In-person conversations
- ✅ Private text messages
- ✅ Direct emails
- ✅ Phone calls
- ✅ Any secure/private communication method

**DO NOT:**
- ❌ Post publicly on social media
- ❌ Include in searchable locations (forums, public Discord, etc.)
- ❌ Share in group chats with unapproved members

## How It Works

### Technical Flow

1. User visits `fanclub.html`
2. JavaScript checks `sessionStorage` for authentication flag
3. If not authenticated: Show access code overlay prompt
4. User enters code
5. JavaScript compares entered code (case-insensitive, trimmed) to stored code
6. **Correct code:**
   - Store `'authenticated'` flag in `sessionStorage`
   - Hide overlay prompt
   - Show Fan Club content
7. **Incorrect code:**
   - Display humorous error message
   - Keep prompt visible
   - Allow retry (unlimited attempts)

### Session Persistence

Authentication uses `sessionStorage` (not `localStorage`):
- ✅ Persists for current browser session (until browser closes)
- ✅ Separate per browser tab
- ✅ Clears when browser closes
- ✅ Good balance between convenience and access control

## Changing the Access Code

If you need to change the access code (new season, security refresh, etc.):

### Step 1: Update the Code

1. Open `assets/js/fanclub-auth.js`
2. Find this line (around line 45):
   ```javascript
   const FANCLUB_CODE = 'KRAKEN';
   ```
3. Replace `'KRAKEN'` with your new code:
   ```javascript
   const FANCLUB_CODE = 'YOURNEWCODE';
   ```
4. Keep it uppercase, no spaces, memorable for approved fans

### Step 2: Commit and Deploy

```bash
git add assets/js/fanclub-auth.js
git commit -m "Update Fan Club access code"
git push
```

GitHub Pages will automatically deploy the change within a few minutes.

### Step 3: Notify Approved Fans

Send private messages to all approved fans with the new code.

**Suggested message template:**
```
Hey! We've updated the Fan Club access code.

New code: [YOURNEWCODE]

Visit: https://durtnurs.com/fanclub.html

Let me know if you have any issues!
```

## Fan Club Contents

### Full Gallery

- **ALL** photos and videos from `assets/data/gallery.json`
- Includes items marked `"public": false` (Fan Club exclusive)
- Same lightbox functionality as public gallery
- Exclusive content badge on non-public items

### Direct Band Contact

- **DeadBeat:** deadbeat@durtnurs.com
- **SnowMan:** snowman@durtnurs.com

These are direct mailto: links for approved fans to contact band members.

### Member-Exclusive Messaging

- Welcome message for authenticated members
- Behind-the-scenes content descriptions
- Humorous band personality throughout
- Exclusive tone: "You've earned access"

## Approved Fans List

Keep track of who has access (private tracking, not published):

| Name | Date Added | Contact Method | Notes |
|------|------------|----------------|-------|
| Example Fan | 2024-12-03 | Email | Close friend from college |
| | | | |

_(Add rows as you approve new fans)_

## Troubleshooting

### "I entered the code but it's not working"

Check:
- ✅ Code is spelled correctly (KRAKEN)
- ✅ No extra spaces before/after
- ✅ JavaScript is enabled in browser
- ✅ Browser supports sessionStorage (all modern browsers do)
- ✅ Not in private/incognito mode (sessionStorage may be disabled)

### "The page keeps asking for the code every time"

This is expected behavior:
- Code is required once per browser session
- Closing browser clears sessionStorage
- New tab = new session = need to re-enter code
- This is intentional for casual security

### "I can see the code in the page source!"

Yes! This is intentional. This is **not secure** - it's casual gatekeeping for friends. Anyone determined enough to view source can find the code. That's the design.

### "Can we add a real login system?"

Not easily with static GitHub Pages hosting. You'd need:
- Server-side code (Node.js, Python, PHP, etc.)
- Database for user accounts
- Hosting that supports server-side execution

For this use case, the current approach is perfect. If you need real security, consider:
- Cloudflare Access (works with static sites)
- Move to a platform with server-side support (Netlify, Vercel, etc.)
- Self-host with authentication

## Future Enhancements

Possible additions to Fan Club (all client-side compatible):

### Easy Wins
- [ ] Category filtering in gallery
- [ ] Search functionality for photos
- [ ] Fan submission form (via Google Forms embedded)
- [ ] Exclusive news announcements

### Moderate Effort
- [ ] Comment system (via third-party service like Disqus)
- [ ] Fan poll/voting system
- [ ] Exclusive music previews (private YouTube links)
- [ ] Fan art gallery

### Requires Server-Side
- [ ] Upload new photos directly (needs backend)
- [ ] Real-time chat (needs WebSocket server)
- [ ] User accounts with profiles (needs database)
- [ ] Contribution approval workflow (needs backend)

## Maintenance

### Regular Tasks
- **Monthly:** Review approved fans list
- **Quarterly:** Consider changing access code
- **As Needed:** Add new exclusive content to `gallery.json` with `"public": false`

### Content Management

To add new Fan Club exclusive photos:

1. Add image files to `assets/images/gallery/`
2. Edit `assets/data/gallery.json`
3. Add new media object with `"public": false`
4. Commit and push changes

Example:
```json
{
  "id": "photo-999",
  "type": "photo",
  "title": "Exclusive Behind the Scenes",
  "description": "What really happens at practice.",
  "filename": "exclusive-photo.jpg",
  "thumbnail": "exclusive-photo-thumb.jpg",
  "date": "2024-12-03",
  "category": "backstage",
  "public": false,  ← THIS MAKES IT FAN CLUB ONLY
  "featured": false
}
```

## Questions?

Contact the site maintainer or band members:
- DeadBeat: deadbeat@durtnurs.com
- SnowMan: snowman@durtnurs.com

---

**Last Updated:** December 3, 2024
**Current Code:** KRAKEN
**Next Review:** March 2025
