# Portfolio — shukhratr.github.io

Static GitHub Pages site for Shukhrat Rustamov (Senior QA Automation Engineer). The style follows david-hckh.com: beige look, 3D hero, blue hologram About section. No build step; pushing to `main` deploys.

## Structure
- `index.html` — all page content (hero track → hologram → about-more → experience → expertise → stack → footer)
- `css/tokens.css` — design tokens (colors, spacing, radii, type scale, easing). Use these and never hard-code new values.
- `css/style.css` — every component style; hologram styles are at the bottom (`.holo*`)
- `js/avatar.js` — `buildAvatar({pose:'sit'|'stand'})`, plus the shared `mat()` / `rbox()` helpers
- `js/hero.js` — desk scene and the scroll-driven camera, chair swivel and wave (`.hero-track` is 320vh, `.hero` is sticky)
- `js/hologram.js` — hologram section: standing avatar with a shader material, pedestal and grid
- `js/main.js` — scroll reveal (`.reveal`), back-to-top, footer year
- `img/` — company logos; `img/me.glb` (planned) is a realistic avatar that replaces `buildAvatar` when present

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
  - `?p=0..1` forces the hero scroll progress (0 = typing, 1 = turned and waving).
  - To check sections below the hero, use a temporary copy of `index.html` with `.hero-track` removed, then delete it.
