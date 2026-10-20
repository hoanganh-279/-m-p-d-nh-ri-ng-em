# Secret Photobooth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Bí mật post-PIN content with a Women’s Day floral-frame photobooth that downloads a framed PNG (no in-app gallery).

**Architecture:** PIN gate stays in `SecretVault`; unlocked state mounts `SecretPhotobooth` with `useUserCamera` + `WomensDayFrame` SVG; capture composites mirrored video + SVG onto canvas and triggers a file download.

**Tech Stack:** React, TypeScript, `navigator.mediaDevices.getUserMedia`, Canvas 2D, existing theme tokens (rose / blush / champagne / paper).

## Global Constraints

- Download only — no localStorage / IndexedDB / server upload for captures.
- Remove gift gallery and empty-state developer instructions from Bí mật.
- Frame style: ornate floral + ribbon + `8 · 3` (spec option A).
- Vietnamese UI copy; stop camera tracks on close/unmount.
- HTTPS or localhost required for camera (document in comments only if needed).

---

## File map

| Path | Action |
|------|--------|
| [src/data/secrets.ts](src/data/secrets.ts) | Slim to `SECRET_PIN` |
| [src/hooks/useUserCamera.ts](src/hooks/useUserCamera.ts) | Create |
| [src/ui/WomensDayFrame.tsx](src/ui/WomensDayFrame.tsx) | Create |
| [src/scenes/SecretPhotobooth.tsx](src/scenes/SecretPhotobooth.tsx) | Create |
| [src/scenes/SecretVault.tsx](src/scenes/SecretVault.tsx) | Wire photobooth; delete gallery/viewer |

---

### Task 1: Slim secrets data

**Files:**
- Modify: `src/data/secrets.ts`

- [ ] Remove `SecretItem` type and `secretItems` array (and related comments about `public/secrets/`).
- [ ] Keep `export const SECRET_PIN = '…'` unchanged.
- [ ] Grep for `secretItems` / `SecretItem` and fix any broken imports (only `SecretVault` expected).

**Verify:** Project typechecks / Vite still resolves `SECRET_PIN` import.

---

### Task 2: `useUserCamera` hook

**Files:**
- Create: `src/hooks/useUserCamera.ts`

- [ ] API: `{ videoRef, status: 'idle' | 'loading' | 'live' | 'error', errorMessage?, start(), stop() }`.
- [ ] `start()`: `getUserMedia({ video: { facingMode: 'user' }, audio: false })`, assign to `videoRef.current.srcObject`, `play()`.
- [ ] `stop()`: stop all tracks, clear `srcObject`.
- [ ] Cleanup on unmount via `useEffect` return.
- [ ] Map permission / NotFound errors to short Vietnamese strings.

**Verify:** Hook compiles; no stream leaks when calling stop twice.

---

### Task 3: `WomensDayFrame` SVG

**Files:**
- Create: `src/ui/WomensDayFrame.tsx`

- [ ] Props: `className?`, optional `id` for export referencing.
- [ ] ViewBox fixed (e.g. `0 0 360 440`); transparent center “window” so video shows through; floral corners, champagne ribbon curves, bottom `8 · 3` in display font feel (SVG text).
- [ ] Colors from CSS variables or Tailwind theme: rose `#f26b9b`, blush, champagne, paper — match site tokens.
- [ ] pointer-events none when used as overlay.

**Verify:** Component renders alone without layout shift; center stays clear for video.

---

### Task 4: `SecretPhotobooth` + capture/download

**Files:**
- Create: `src/scenes/SecretPhotobooth.tsx`

- [ ] States: `live` | `preview`.
- [ ] Layout: relative box → `<video>` mirrored (`scale-x-[-1]`) object-cover → absolute `WomensDayFrame` overlay matching box aspect.
- [ ] Controls live: primary **Chụp**; show loading/error UI with **Thử lại**.
- [ ] On capture: canvas sized to export resolution (e.g. 720×880); draw mirrored video into window rect; draw SVG (serialize via `XMLSerializer` + `Image` or duplicate draw paths) on top; `toBlob('image/png')` → store object URL for preview.
- [ ] Preview: show result image; **Tải về** (`<a download="bi-mat-8-3.png">`); **Chụp lại** revokes URL and returns to live (camera still running or restart if stopped).
- [ ] Accept `onReady`/`active` from parent if needed so vault close always calls `stop()`.

**Verify:** Manual: allow camera → see frame → capture → PNG downloads with frame → retake works.

---

### Task 5: Wire `SecretVault`

**Files:**
- Modify: `src/scenes/SecretVault.tsx`

- [ ] After unlock, render `<SecretPhotobooth />` instead of `SecretGallery` / empty state.
- [ ] Delete `SecretGallery`, `SecretViewer`, and `active` item state / Escape-to-close-viewer branch (Escape only closes vault).
- [ ] On `open === false`, ensure photobooth unmounts (camera cleanup via hook).
- [ ] Keep PIN shake animation and panel entrance as today.
- [ ] Subtitle when unlocked remains “Quà dành riêng cho em”.

**Verify:** Full path: open Bí mật → wrong PIN → right PIN → photobooth → Esc closes and re-locks → reopen needs PIN again; camera LED off after close.

---

### Task 6: Smoke polish

- [ ] Mobile: frame + buttons usable in narrow panel (`max-w-lg`); safe-area already on vault.
- [ ] Confirm no references to `public/secrets/` remain in UI.
- [ ] Optional: add `.superpowers/` to `.gitignore` if brainstorm artifacts should stay local.

**Verify:** Desktop + phone width; denied-permission path shows Vietnamese retry.
