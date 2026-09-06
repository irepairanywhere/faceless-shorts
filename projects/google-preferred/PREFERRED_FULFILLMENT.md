# Comment "PREFERRED" — fulfillment

Send this when someone comments PREFERRED on the Google Preferred Sources short.

---

**Google Preferred Sources — the 2-minute setup**

Google lets readers pick sites they want to see more of. Once a reader picks you, your links get a "Preferred" label for them inside AI Overviews, AI Mode and Top Stories. It works at the domain level (example.com or blog.example.com, not example.com/blog).

**Option A — Google's button (recommended).** Paste this where you want the button (footer, end of every post):

```html
<script async src="https://news.google.com/swg/js/v1/publisher.js"></script>
<div google-add-preferred-source-btn></div>
```

One click adds your site and returns the reader to your page.

**Option B — a plain link.** Use Google's deeplink with your domain:

```
https://www.google.com/preferences/source?q=yourdomain.com
```

Example: `<a href="https://www.google.com/preferences/source?q=yourdomain.com">Add us as a preferred source on Google</a>`

Google's official black badge image is downloadable from the Search Central page below if you want the branded button look.

**Where to put it:** site footer + the end of every blog post. Add a click event in GTM so you can see how many readers opt in.

**Source (Google's own docs):** https://developers.google.com/search/docs/appearance/preferred-sources
**Google's announcement for AI Overviews / AI Mode (May 27, 2026):** https://blog.google/products-and-platforms/products/search/original-high-quality-content-search/

Want us to install it and wire the tracking? Reply "install".
