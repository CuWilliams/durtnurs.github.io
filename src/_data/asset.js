/**
 * BUILD VERSION STAMP
 *
 * Every CSS, JS and data URL on the site gets "?v=<this>" appended.
 *
 * Why: assets are served from fixed paths with `cache-control: max-age=14400`,
 * so a browser that has visited once keeps its copy for four hours no matter
 * what we deploy. Shipping a fix and telling people to hard-refresh is not a
 * deployment strategy — and for the message board it was an actual defect,
 * because an approved note could sit invisible for four hours.
 *
 * A changing query string makes each deploy a new URL, so browsers and the
 * Cloudflare edge both fetch it fresh. Unchanged deploys still bust the cache,
 * which costs a few KB and is the cheap side of the trade.
 */
module.exports = {
  v: process.env.BUILD_VERSION || String(Date.now())
};
