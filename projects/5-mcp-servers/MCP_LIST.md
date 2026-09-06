# The 5 connections that run Rocket Launch Media (comment "MCP" fulfillment)

MCP servers are plug-ins that let Claude Code use your real tools. Connect once in Claude → Settings → Connectors (or via a plugin/MCP config), then just ask in plain English.

1. **GoHighLevel (CRM + Social Planner)** — reads pipelines, moves opportunities, drafts follow-ups, schedules posts to TikTok/Facebook/LinkedIn/Instagram. Connect: GHL Marketplace app "GHL x Claude" → authorize your sub-account.
2. **Google Workspace (Drive, Gmail, Calendar)** — finds files, drafts/sends email, books meetings. Connect: Claude connectors → Google Drive, Gmail, Google Calendar.
3. **WordPress** — edits pages, Yoast titles/meta, publishes posts, uploads media. Connect: install an MCP plugin on the site (we use Royal MCP) and add the site URL + key in Claude.
4. **Meta Ads** — pulls spend, leads, cost per lead, creatives; pauses/edits ad sets. Connect: Ryze AI or Windsor.ai connector → link your ad account.
5. **ElevenLabs** — text-to-speech with word timestamps, music, sound effects for every video. Connect: Claude connectors → ElevenLabs (API key from elevenlabs.io).

Bonus: the whole faceless-video pipeline (script → voice → render) is open in my repo; ask and I'll share it.
