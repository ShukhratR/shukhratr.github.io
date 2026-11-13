# Redesign checklist: david-hckh.com style, Shukhrat's content

This plan matches the reference's **layout, motion and style** and fills it with Shukhrat's own content. Every 3D model, illustration, logo, song and line of code is original. Nothing is copied from the reference site.

Status: ✅ done · 🟡 partial · ⬜ to do

## 1. Global
- ✅ Beige palette, Urbanist + Space Mono, design tokens
- ✅ Fixed header: centered pill menu, orange "Get in touch", sound toggle
- ✅ Logo tile at top left (original "SR"), turns light on blue
- ✅ Menu turns blue over the hologram, active link highlighted
- ⬜ **Sliding menu highlight**: one pill that glides between links; the active link is orange on beige sections and blue on the blue section
- ✅ Music: original lo-fi generated in the browser, off by default
- ⬜ **Custom cursor**: a small circle that grows and inverts over links and buttons, hidden on touch screens
- ⬜ **Preloader**: the "SR" mark fills up while the 3D scenes load, then fades out
- ⬜ **Notch corners**: curved inverted corners where panels meet (blue → Experience, Experience → contact panel)

## 2. Hero (landing)
- ✅ Large name, rotated "QA Automation" tag, original desk room scene
- ✅ Room framing zoomed like the reference, wall props clear of the menu, chibi head at the desk
- ✅ Room: two monitors, speaker, grid cube, pen cup, rubber duck, shelf with books and cactus, cork board with pins, picture frame, plant, sled chair, layered rug
- ✅ Avatar typing at the desk (curly black hair, grey tee)
- 🟡 **Bigger title and tag, positioned like the reference** (tag overlapping the bottom-right of the surname)
- ⬜ **Scroll hint** icon (mouse outline) centered at the bottom
- ✅ Hero is name and tag only (intro kept for screen readers)

## 3. Story: hero → hologram
- ✅ Beige panel tilts up and away, blue stage underneath
- ✅ Avatar turns from facing away to facing front and stays centered
- ✅ Bottom-up scan from colour to hologram, 000 → 100 counter, cards wipe in with connector dots
- 🟡 **Floor**: perspective grid with glowing dots (still reads flat)
- ⬜ **Pedestal**: a layered disc with a rim glow and the counter set into its front face
- ⬜ Text in the cards appears with a typing / letter-reveal effect

## 4. Experience (= reference "Projects")
- ✅ "Selected" tag + large heading, cards with orange arrow buttons, "Your team next?" empty card
- ⬜ **2-column large image cards** with a notched corner around the arrow button, the image zooming slightly on hover and the card lifting
- ⬜ **Images for each job.** Needs input from Shukhrat: screenshots of frameworks, test reports or dashboards. Otherwise original generated illustrations (pipeline, test run, bug board)
- ⬜ Card click opens a detail panel (role, achievements, stack), or a link

## 5. Expertise + Tech stack (extra sections, not on the reference)
- ✅ Six skill cards, stack chips
- ⬜ Decision: keep as is, restyle to match, or merge into Experience details

## 6. Contact
- 🟡 "Let's work together!" + social buttons (Mail, LinkedIn, GitHub, Phone)
- ⬜ **Round icon-only social buttons**, like the reference
- ✅ **Contact 3D scene** in a rounded beige panel: the avatar standing with arms crossed in an original QA setting (sticky-note test cases, a "PASSED" stamp, a coffee mug, a rubber duck), not the reference's moving boxes
- ⬜ Menu switches to "Contact" active here

## 7. Footer
- ✅ Back-to-top button, ©
- ⬜ Reference layout: back-to-top centered; links on the right (Privacy if wanted, Resume PDF); credit line "Music generated live · © 2026 Shukhrat Rustamov"

## 8. Quality
- 🟡 Mobile layout of the story section and cards (not yet checked on a phone)
- ⬜ Performance: render 3D scenes only when visible (✅ hero), lower pixel ratio on mobile, lazy-start the hologram
- ⬜ Accessibility: reduced motion (✅), keyboard focus on the toggle and links, labels on the cursor-free path
- ⬜ Side-by-side screenshot check against the reference at 1440px and 390px for every section

## Needs input from Shukhrat
1. Images for the Experience cards (or approval for generated illustrations)
2. Keep, restyle or merge the Expertise and Tech stack sections?
3. Footer links: resume PDF? privacy page?
4. Optional `.glb` avatar (Avaturn) for a realistic likeness

## Suggested order (token-efficient batches)
1. Global polish: sliding menu highlight, cursor, notch corners, preloader
2. Hero text and layout tweaks + pedestal and floor polish
3. Contact 3D scene + footer
4. Experience cards (after images arrive)
5. Mobile pass + final side-by-side comparison
