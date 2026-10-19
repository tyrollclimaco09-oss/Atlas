# ATLAS — Raphael Mobile UI Refinement (2026-10-19)

**Scope:** presentation-only refinement; source base `4c81455226346006a556e858be3ae9dddac3b4e2`.
**Branch:** `review/operator-raphael-ui-2026-10-19`.
**Status:** REVIEW-ONLY. Never treat a green design test as a live slate or identity certification.

## User experience diagnosis

The previous mobile page led with explanation and many similarly weighted controls. Most convenient shortcuts required choosing, scrolling and copying before any visible outcome. The user explicitly asked for a larger, seamless, Tensura/Raphael-inspired interface, but without repeating setup steps.

## Intentional design changes

- New **Raphael visual layer**: sapphire/indigo night gradients, cool cyan aura, silver-blue type, restrained geometric magic-circle motifs. System fonts and CSS-only artwork; no licensed imagery, web fonts, API calls or trackers.
- **Actual workflow first**: move the existing continuity section to the top of the main region; a clearer welcome heading and large, thumb-friendly Continue, Restore context, and Go to ChatGPT controls.
- **One prominent slate action** in a separate cyan treatment. Explicitly labeled a *research handoff*; cannot execute bets or imply price confidence.
- **Progressive disclosure**: secondary shortcuts remain available behind "More shortcuts". Existing Live STATUS, legacy notes, local return link and original actions are preserved; no canonical action/registry mutation.
- **Larger layout** for desktop/tablet/mobile: widths, contrast, tactile targets, responsive grid, readable text, focus indications and reduced-motion support.
- **Never persist approval**: the earlier local continuity logic remains unchanged in this pass apart from the DOM layout; no storage of drafts, tokens, bet stakes or data. Consent still resets on navigation. No automatic write, GitHub token, or model connection was added.
- All CSS is in a distinct additive `command-center/operator-raphael.css`, packaged with the exact source. Static Vercel rules already allow operator-*.css.

## Acceptance checks

- Existing five GitHub review jobs, including source custody, scenario research, checkpoint, Node tests and **real Chromium mobile** tests, must pass at the latest exact branch SHA before deployment.
- New browser checks cover priority-first DOM order, touch target heights, no horizontal overflow at 320/375/390/430/768 px, progressive disclosure, no outside traffic, reduced motion, and retained action/approval gates.
- Bundle test confirms themed CSS actually survives the isolated build and applies within the private page.
- Deploy only a **protected Vercel preview** after fresh readback of GitHub HEAD, exact CI and `Vercel Authentication: All Deployments`. No production promotion or Git auto-import.

## Ground truth / limitations

The static Operator Remote remains a review-only **prompt launcher**, not the source of the user's actual saved slate and not a live GitHub write client. A project recovery prompt cannot magically reopen the same ChatGPT thread. Hosted owner login and anonymous refusal must still be proven in an independent browser, not inferred from UI styling or Vercel settings. No change to Arc III 0/15, MasterSave, Human Final Gate, sportsbook access or original Command Center.

**Doctrine:** evidence before confidence, knowledge over greed, one ATLAS—not another fragmented brain.
