# Analytics

## Decision
Use Google Analytics 4 only. Do not add PostHog or another analytics platform unless a later need justifies it.

Configuration:
- GA4 Measurement ID: `G-CH9NXJH2NW`.
- The Measurement ID is a public frontend identifier and is kept directly in `src/analytics.ts`.
- No environment variable is required for analytics.
- The Google tag is loaded only in the browser; prerender/SSR output is unchanged.
- The local `gtag()` shim must match Google's official queue behavior and push the function `arguments` object into `dataLayer`.

Tracked events:
- `page_view`
- `contact_view`
- `contact_submit`
- `email_click`
- `phone_click`
- `cta_click`
- `case_view`
- `insight_view`
- `ai_referral` (once per browser page load when the landing URL has `utm_source=chatgpt` or `source=chatgpt`, or the browser referrer is ChatGPT)

Referral attribution:
- `page_view.page_location` preserves only `utm_source`, `utm_medium`, `utm_campaign`, and `source` with simple alphanumeric, underscore, or hyphen values (max 80 characters). Other URL parameters are not sent.
- `ai_referral` reports `referral_source=chatgpt`, `attribution_method` (`url_parameter` or `referrer`), and `landing_page`; it does not send the raw referrer or other query parameters.
- ChatGPT does not always attach URL parameters or provide a referrer, so attribution will be incomplete. GA4 event parameters may need custom dimensions registered to appear in standard reports.

## Performance and SEO
- Do not place a synchronous Google Analytics script in `index.html`.
- The external `gtag.js` script is injected after browser idle time, with a short timeout fallback.
- Script loading is `async` and never blocks HTML parsing or rendering.
- No Firebase JavaScript SDK is added just for analytics.
- Analytics must not alter titles, descriptions, canonical URLs, JSON-LD, sitemap, robots, or crawlable page content.

## SEO reporting cadence

GA4 events are instrumentation, not evidence of ranking or conversion improvement by themselves. Compare Google Search Console query/page impressions, clicks and positions with qualified GA4 contact actions when reviewing SEO. See [`seo-status-and-todo.md`](seo-status-and-todo.md); reviews are ad hoc when the user resumes the workstream, not an automated recurring report.
