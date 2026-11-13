# Portfolio — shukhratr.github.io

Static GitHub Pages site for Shukhrat Rustamov (Senior QA Automation Engineer). The style follows david-hckh.com: beige look, 3D hero, blue hologram About section. No build step; pushing to `main` deploys.

## Structure
- `index.html` — all page content (story track [hologram stage under the hero panel] → experience → expertise → stack → footer)
- `css/tokens.css` — design tokens (colors, spacing, radii, type scale, easing). Use these and never hard-code new values.
- `css/style.css` — every component style; hologram styles are at the bottom (`.holo*`)
- `js/utils.js` — shared `mat()` / `rbox()` helpers for the 3D scenes
- `js/avatar-loader.js` — `loadRiggedAvatar({height, animation, once})` loads `img/avatar/me.glb` (Avaturn) and the Mixamo clips `typing` / `idle` / `greeting` (retargeted by bone name, rotations only); used by all three scenes
- `js/hero.js` — desk scene: seated avatar typing, wide monitor with Java, keyboard/mouse aligned to the hands, robot that 'speaks' notifications, music notes, cat (`img/cat.glb`), family photo
- `js/hologram.js` — scroll story controller for `.story-track` (520vh) and sticky `.stage`: the hero panel lifts away, a clip-plane scan turns the colour avatar into a hologram, the 000→100 counter, card reveals and the dark header
- `js/main.js` — scroll reveal (`.reveal`), back-to-top, footer year, active nav link
- `tools/scroll.mjs` — real-scroll screenshots through the DevTools protocol (needs Node 22+)
- `js/contact.js` — end-of-page scene: avatar greets once then idles; robot laps and parks under the links
- `js/music.js` — generated lo-fi loop, key clicks and message chime (off until first interaction)
- `img/` — company logos, `family.jpg`, `cat.glb` (CC BY, credited in footer), `avatar/` (rigged avatar + clips)

## Standards
- Three.js `0.160.0` via the importmap in `index.html` (jsdelivr). Pin exact versions.
- Colors: bg `#f5efe6`, text `#2d2a24`, accent orange `#ff8400`, dark blue `#002474`. Fonts: Urbanist and Space Mono (for tags and the hologram).
- Respect `prefers-reduced-motion`. Pause rendering offscreen (IntersectionObserver). Breakpoints: 1024 / 840 / 480.
- Accessibility: semantic landmarks, alt text, `aria-label` on canvases, visible focus states.
- Commits end with the `Co-Authored-By` line. The user has approved pushing to `main`.

## How requests arrive
The user usually sends three things together: a full-page screenshot, pasted CSS (computed styles or variables) and a link to a reference site.
- Treat the screenshot as the target layout and the pasted CSS as exact values; add new values to `tokens.css`.
- Recreate the style and structure with the user's own content. Never copy the reference site's assets, artwork, models or text.
- Don't crawl the link. Use the screenshot first, and fetch the link only if something is unclear, such as scroll behavior.
- Compare your result against the user's screenshot at the same width.

### Request checklist (ask only for items that are missing and actually block the work)
```
Section: <which one; replace or add>
Text:    <real copy, numbers, links, dates>
Assets:  <files dropped in img/>
Motion:  <scroll/hover/animation behavior>
Mobile:  <specifics, or "your call">
Push:    <yes / preview first>
```
Defaults if not given: keep existing content, decide mobile layout yourself, push to `main`.

## Workflow (token-saving)
- Make small, targeted edits. Don't re-read large files you already know; grep for what you need.
- No subagents. Keep replies short.
- Verify with one headless Chrome screenshot per change:
  ```
  python3 -m http.server 8765 &   # from repo root
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --use-angle=swiftshader \
    --enable-unsafe-swiftshader --virtual-time-budget=9000 --hide-scrollbars --window-size=1440,900 \
    --screenshot=<scratchpad>/shot.png "http://localhost:8765/?p=0"
  ```
  - `?p=0..1` forces the story progress (0 = hero, ~0.2 = stage revealed, ~0.5 = mid-scan, 1 = full hologram).
  - For real scrolling, or to compare against a reference site, use the same scroll positions on both:
    `node tools/scroll.mjs <url> <scratchpad> <prefix> 0 700 1400 2100 2800`, then shrink the shots with `sips -Z 480` before viewing them.
    Plain `--screenshot` can't capture scrolled positions.
