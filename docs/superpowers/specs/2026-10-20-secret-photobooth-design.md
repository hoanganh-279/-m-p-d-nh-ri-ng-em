# Secret Photobooth (Bí mật) — Design Spec

**Date:** 2026-10-20  
**Status:** Approved in brainstorming

## Goal

After unlocking the Bí mật PIN gate, the user enters a Women’s Day photobooth: live camera inside an ornate floral SVG frame, capture a framed still, and download a PNG to their device. No in-app gallery of gifts or captured photos.

## Decisions (locked)

| Topic | Choice |
|--------|--------|
| Mode | Live preview + capture |
| Persistence | Download only (no localStorage / no app gallery) |
| Placement | Replaces post-PIN content (no empty-state instructions) |
| Gift gallery | Removed — Bí mật is photobooth only |
| Frame style | Ornate floral + champagne ribbon, `8 · 3` caption (option A) |
| Approach | SVG frame overlay + canvas composite on capture |

## User flow

1. User opens Bí mật → enters PIN (`SECRET_PIN`).
2. On success → photobooth (live mirrored camera inside floral SVG frame).
3. **Chụp** → preview of composited image (camera + frame).
4. **Tải về** → download `bi-mat-8-3.png` (or timestamped name).
5. **Chụp lại** → return to live view.
6. Close / Esc → stop camera stream, lock vault again on next open.

Camera permission denied or hardware error: short Vietnamese message + retry; no crash.

## Architecture

```
SecretVault (PIN gate)
  └─ SecretPhotobooth
       ├─ useUserCamera (getUserMedia, stop on unmount/close)
       ├─ WomensDayFrame (SVG overlay, shared for live + export)
       └─ canvas composite → download blob
```

### Files

| File | Role |
|------|------|
| `src/scenes/SecretVault.tsx` | Keep PIN UI; after unlock render photobooth only; remove gallery / empty state / SecretViewer |
| `src/scenes/SecretPhotobooth.tsx` | Live / preview states, Chụp / Tải về / Chụp lại |
| `src/ui/WomensDayFrame.tsx` | Floral + ribbon SVG using theme tokens (rose, blush, champagne, paper) |
| `src/hooks/useUserCamera.ts` | Request stream, attach to `<video>`, cleanup tracks |
| `src/data/secrets.ts` | Keep `SECRET_PIN` only; remove `SecretItem` / `secretItems` media API |

## Capture rules

- Mirror preview (`scaleX(-1)`) so selfie feels natural; bake the same mirror into the canvas export.
- Draw video frame, then SVG frame on top, then export PNG.
- Do not persist captures in the app.

## Copy / a11y

- Header unlocked: title “Bí mật”, subtitle “Quà dành riêng cho em”.
- Frame decoration includes `8 · 3`.
- Buttons: “Chụp”, “Tải về”, “Chụp lại”; dialog labels in Vietnamese.
- `prefers-reduced-motion`: keep existing panel entrance behavior; no extra flash/countdown (out of scope).

## Out of scope

- Countdown / flash photobooth effects  
- Multiple frame themes  
- Saving to gallery or server  
- Reintroducing static gift media in this vault  

## Success criteria

- PIN still required; stream stops when modal closes.
- Live camera visible inside floral frame on HTTPS / localhost.
- Downloaded PNG includes both face crop and decorative frame.
- No leftover empty-state developer instructions or gift grid in Bí mật.
