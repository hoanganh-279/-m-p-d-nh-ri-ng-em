# Responsive Multi-Platform Design

**Date:** 2026-10-20  
**Scope:** Progressive enhancement of the existing React + R3F web app for mobile and desktop (same URL). No PWA or native wrappers.

## Goals

- Layout fits phone chrome (notch / home indicator) and desktop without redesigning the experience.
- WebGL LOD stays correct on phones in portrait and landscape.
- Touch gestures (drag, pinch, tap / double-tap) are predictable.

## Architecture

Keep `App → HeartSpace (R3F) + UI chrome`. Extend `isMobile` in Zustand; UI and LOD read that flag.

### Device detection

`isMobile` is true when:

- `max-width: 768px`, or
- `(pointer: coarse)` and `max-height: 500px` (phone landscape)

### Viewport

- Root uses `height: 100%` with `height: 100dvh` override.
- ControlBar / MusicPlayer / Hint respect `env(safe-area-inset-*)`.

### ControlBar

- **Mobile:** primary row = zoom ±, free mode, music, open letter; secondary = FX, reset, sliders. Hit targets ≥ 44px.
- **Desktop:** existing full toolbar layout.

### Hint copy

- Mobile: `Kéo · chạm tim · chụm zoom`
- Desktop: drag / tap / morph / scroll zoom

### LOD

- Existing mobile DPR, antialias, particle, and cosmos budgets.
- PhotoCard: smaller billboard, fewer segments, lower texture anisotropy on mobile.

### Touch

- Pinch zoom uses non-passive `touchmove` and `preventDefault` while two fingers are active.
- Heart single-tap pulse is delayed (~280ms) so double-tap (same spot, &lt;320ms, &lt;36px) can cancel and reset instead.

## Out of scope

PWA, Capacitor/native shells, separate MobileChrome/DesktopChrome, GPU capability tiers.
