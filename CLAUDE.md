# קניות (kniot) — agent onboarding

Hebrew, RTL, offline-first PWA for a household: keep a fixed **should list** ("מה צריך": what the home should always have), count **what's at home** ("מה יש"), and turn the gaps into a **shopping list** ("לקנייה"). No server, no accounts. Owner: Yuval (GitHub `yuvalbigel-p`). Users are Hebrew speakers on iPhones, used as a home-screen PWA. All user-facing text is Hebrew; keep it that way.

- Live: https://yuvalbigel-p.github.io/kniot/  ·  Repo: https://github.com/yuvalbigel-p/kniot
- Stack: React + Vite + TypeScript, vite-plugin-pwa, lz-string, vitest. No router/state library.
- Commands: `npm run dev`, `npm test` (vitest, pure logic only), `npm run build` (tsc + vite). Icons regenerate from `public/icon.svg` via `node scripts/icons.mjs`.
- Deploy: push to `main` → GitHub Actions (`.github/workflows/deploy.yml`) → Pages, ~40s. Vite `base` is `/kniot/`.
- Commit trailer used: `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

## Product model: two completely separate paths

1. **Weekly flow** (needs a should list): Home → **home check** (`#/check`, step 1 "מה יש") → **shopping list** (`#/shop`, step 2 "לקנייה"). Starting a check from home resets counts to 0. Shopping qty = target − have.
2. **Should list editing** (`#/should`): NOT part of the flow. Reached from home ("עריכת רשימת מה צריך"), edit-only, "סיום" returns home. Sections (with icon) → items (name, target qty). Stepper to 0 deletes the item.
3. **One-off list** (`#/quick`): standalone checklist with quantities, add field at top, reset button. Never touches the should list or weekly shopping list (own storage key).

Hard rules from the owner (don't regress):
- **The should list never changes unless the user explicitly edits it** (or loads default / imports / restores). Replacing it silently snapshots the old one into `previous` ("שחזור הרשימה הקודמת"). A past data-loss complaint drove this.
- **No undo banners, minimal confirmations.** Owner accepts irreversible actions; plain toasts only. (A confirm dialog exists for bulk clears.)
- **Data must survive on iPhone** (see Storage).
- **Launch logic:** swipe-away (app killed) → opens on home; quick app switch → stays on the same screen (`sessionStorage['kaniyot.session']`, see `src/App.tsx`).
- Drag to reorder: sections and items via **grips**; "collapse all" button collapses sections, then sections are draggable; dragged element floats under the finger. Sections are collapsible (state in `kaniyot.collapsed.v1`).
- Owner may deviate from the original spec for better UX; UX wins over spec.
- iOS keyboard accessory bar can't be removed from a web app — don't try.

## Code map

- `src/main.tsx` – boot: service worker, visualViewport/keyboard CSS vars (`--vvh`, `.kb` class), input "calming" attributes, IndexedDB restore (`initDurability`) before first render.
- `src/App.tsx` – `Shell`: hash-route → screen, landing resolution, last-tab tracking.
- `src/route.ts` – tiny hash router (`#/should|check|shop|welcome|import|quick`), `go(name, replace?)`, iOS/standalone detection.
- `src/store.tsx` – single context: should, counts, shop, quick, default, previous, lastTab, toast, confirm. `replaceShould`/`replaceWithUndo`/`restorePrevious` own the snapshot logic.
- `src/storage.ts` – `KEYS` (all `kaniyot.*.v1`), validated load (corrupt data moved to `<key>.corrupt-<ts>`), `useStoredState`, IndexedDB mirror + `navigator.storage.persist()`.
- `src/theme.ts` – 6 skins via `data-theme` attribute (classic, modern [purple #8B47E0, owner's favorite], night, funky, sea, sunset); CSS-variable driven.
- `src/components.tsx` – shared UI: Steps (2 steps), TabBar (check/shop), Stepper, Menu, Sheet, IconChip/Svg, Chevron, CollapseAll, `useCollapsed`, Grip + **`dragProps`** (pointer-event drag: floating transform, auto-scroll, swaps among `[data-drag-scope]` siblings, post-drag click blocker 250ms).
- `src/screens/` – Welcome (home), Should, Check, Shop, Quick, Share (import screen + paste sheet).
- `src/logic/` – pure, tested (`logic.test.ts`): `should.ts` (edit ops, `moveSectionTo`/`moveItemTo`), `gap.ts`, `shopping.ts` (build lines from gaps, group, `addOneOff`, progress), `share.ts` (lz-string link `#/import?d=`), `diff.ts` (import diff vs local), `validate.ts` (type guards), `icons.ts` (custom SVG icon set, ~34 ids, Hebrew labels), `starter.ts` (default list), `types.ts`.
- `src/styles.css` – all styling; RTL via logical properties (`inline-size`, `margin-inline`…). Later rules override earlier ones (there are appended override blocks at the end).

## Storage & sharing details

- Keys: should, counts, shop (weekly list), quick (one-off), ui (lastTab), default (saved default list), previous (silent snapshot), theme. Every write goes to localStorage and is mirrored to IndexedDB; on boot, missing localStorage keys are restored from the mirror.
- Sharing = only the should list, as an lz-string `compressToEncodedURIComponent` payload in the hash. Decoder must tolerate `+` turned into spaces by URLSearchParams and percent-encoding (past bug). On iOS a tapped link opens in Safari, whose storage differs from the installed PWA → recipients should paste the link into "ייבוא קישור" in the installed app.

## Testing notes

- Unit tests cover logic only. UI was verified with playwright-core driving system Chrome against `npx vite preview` (not committed); there is no way to test on a real iPhone from here, so be explicit about that when reporting.
- macOS has no `timeout`; use `perl`/`python` for scripted edits.

## Known open issue

- Owner reported "numbers set in the should list become n+1 in the home check" — not reproducible in Chrome (mouse/touch emulation). Need a concrete example (item, value set, value shown, screen) or a real-device repro before changing anything.
