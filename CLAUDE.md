# קניות (kniot) — agent onboarding

Hebrew, RTL, offline-first PWA for one household (Yuval and his partner, two iPhones), synced through Firebase: keep a fixed **should list** ("מה צריך": what the home should always have), count **what's at home** ("מה יש"), and turn the gaps into a **shopping list** ("לקנייה"). No accounts: a shared PIN per phone (see Sync). Owner: Yuval (GitHub `yuvalbigel-p`). Users are Hebrew speakers on iPhones, used as a home-screen PWA. All user-facing text is Hebrew; keep it that way.

- Live: https://yuvalbigel-p.github.io/kniot/  ·  Repo: https://github.com/yuvalbigel-p/kniot
- Stack: React + Vite + TypeScript, vite-plugin-pwa, Firebase (Firestore + AI Logic), vitest. No router/state library.
- Firebase project `kniot-e1108` (Spark/free plan, owner Yuval's Google account). Firestore in me-west1 (Tel Aviv).
- Commands: `npm run dev`, `npm test` (vitest, pure logic only), `npm run build` (tsc + vite). Icons regenerate from `public/icon.svg` via `node scripts/icons.mjs`.
- Deploy: push to `main` → GitHub Actions (`.github/workflows/deploy.yml`) → Pages, ~40s. Vite `base` is `/kniot/`.
- Commit trailer used: `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

## Product model: two lists + the should list

Home (`#/welcome`) is a status screen: a weekly card on top, a monthly card with two step rows, small links (edit should list, import, themes).

1. **Weekly · מכולת** (`#/quick`, storage key `quick`): an ongoing list both partners add to during the week. Checkbox strikes through; **"סיום קנייה" removes only checked lines** and returns home. Never touches the should list or the monthly list.
2. **Monthly · סופר** (needs a should list), two steps, each resumes its last state:
   - Step 1 **home check** (`#/check`): counts autosave and mark `check.dirty`; **"שמירה"** merges gaps into the monthly list (`mergeGaps`: update qty in place, add new gaps, drop unbought lines no longer missing, keep one-offs/bought), stamps `check.savedAt`, goes home. "ניקוי" zeroes counts.
   - Step 2 **shopping list** (`#/shop`): "סיום קנייה" removes checked lines, resets counts and `check` meta (next check starts fresh); unbought lines stay as leftovers.
3. **Should list editing** (`#/should`): rare, reached from a small link on home. Sections → items (name, target qty). Stepper to 0 deletes the item.

Hard rules from the owner (don't regress):
- **The should list never changes unless the user explicitly edits it** (or restores a backup). Daily backups exist for safety. A past data-loss complaint drove this.
- **No undo banners, minimal confirmations.** Owner accepts irreversible actions; plain toasts only. (A confirm dialog exists for bulk clears.)
- **Data must survive on iPhone** (see Storage).
- **Launch logic:** swipe-away (app killed) → opens on home; quick app switch → stays on the same screen (`sessionStorage['kaniyot.session']`, see `src/App.tsx`).
- Drag to reorder: sections and items via **grips**; "collapse all" button collapses sections, then sections are draggable; dragged element floats under the finger. Sections are collapsible (state in `kaniyot.collapsed.v1`).
- Owner may deviate from the original spec for better UX; UX wins over spec.
- iOS keyboard accessory bar can't be removed from a web app — don't try.

## Code map

- `src/main.tsx` – boot: service worker, visualViewport/keyboard CSS vars (`--vvh`, `.kb` class), input "calming" attributes, IndexedDB restore (`initDurability`) before first render.
- `src/App.tsx` – `Shell`: hash-route → screen, landing resolution, last-tab tracking.
- `src/route.ts` – tiny hash router (`#/should|check|shop|welcome|quick`), `go(name, replace?)`, iOS/standalone detection.
- `src/store.tsx` – single context: hid, sync state, should, counts, shop (monthly), quick (weekly), checkMeta, lastTab, toast, confirm. Wires local state to `sync.ts`.
- `src/storage.ts` – `KEYS` (all `kaniyot.*.v1`), validated load (corrupt data moved to `<key>.corrupt-<ts>`), `useStoredState`, IndexedDB mirror + `navigator.storage.persist()`.
- `src/theme.ts` – 6 skins via `data-theme` attribute (classic, modern [purple #8B47E0, owner's favorite], night, funky, sea, sunset); CSS-variable driven.
- `src/components.tsx` – shared UI: Steps (2 steps), TabBar (check/shop), Stepper, Menu, Sheet, IconChip/Svg, Chevron, CollapseAll, `useCollapsed`, Grip + **`dragProps`** (pointer-event drag: floating transform, auto-scroll, swaps among `[data-drag-scope]` siblings, post-drag click blocker 250ms).
- `src/screens/` – Pin (one-time PIN), Welcome (home), Should, Check, Shop, Quick.
- `src/logic/` – pure, tested (`logic.test.ts`): `should.ts` (edit ops, `moveSectionTo`/`moveItemTo`), `gap.ts`, `shopping.ts` (build lines from gaps, group, `addOneOff`, progress), `validate.ts` (type guards), `icons.ts` (custom SVG icon set, ~34 ids, Hebrew labels), `starter.ts` (default list), `types.ts`.
- `src/styles.css` – all styling; RTL via logical properties (`inline-size`, `margin-inline`…). Later rules override earlier ones (there are appended override blocks at the end).

## Sync (Firestore) and storage

- `src/sync.ts`. First launch shows the PIN screen (`screens/Pin.tsx`): `pins/{sha256("kniot:"+pin)}` → `{ hid }`. Two PINs point to the same household. The hid (28 random chars) is stored in `kaniyot.hid.v1` and is the real secret; PINs never appear in the repo. Add/change PINs by adding docs in the Firebase console.
- `households/{hid}`: `should`, `counts`, `check`, `backupDay`. `households/{hid}/lines/{lineId}`: one doc per shopping line with `list: 'weekly'|'monthly'` and `order` — per-line docs so concurrent/offline edits don't overwrite each other. `households/{hid}/backups/{YYYY-MM-DD}`: daily snapshot (should + lines), written on app open; restore the should list from the should-list menu ("שחזור מגיבוי"). Joining with a different local should list stores it as `backups/join-<ts>`.
- Rules (published in the console, keep in sync with this): `pins/{pin}` get only; `households/{hid}` get/create/update if `hid.size() >= 24`, no list/delete; `households/{hid}/{col}/{rest=**}` read/write if `hid.size() >= 24`.
- `store.tsx`: every state is local (localStorage + IndexedDB mirror, `useStoredState`) AND synced: user setters save locally then push only the diff (`pusher`); Firestore snapshots apply remote state without pushing back. Firestore's persistent cache gives offline support; the home screen shows sync status.
- First connection per phone (`join`): an empty household is seeded from local data; otherwise the remote should list wins and local unchecked list items are merged in (by name).
- Removed on purpose (owner: "there will be no import, the same list lives on the server"): share links/import, default list, previous-list snapshot.
- Can't reach Firestore from the Claude cloud container or the Cowork VM (egress blocked); test against the live site in the desktop built-in browser.
- Package changes were installed from Linux: run `npm install` on the Mac before `npm run dev`.

## Photo → weekly list (AI)

- `src/ai.ts` (lazy-loaded): camera button on the weekly list → image downscaled to 1600px JPEG → Firebase AI Logic, Gemini Developer API (free tier), model `gemini-3.5-flash-lite`, JSON schema `[{name, qty}]`. Hebrew prompt: always Hebrew, one item per line, quantities parsed, ignore headings/בס״ד.
- App Check is enforced on AI Logic: web app registered with Fraud Defense (reCAPTCHA Enterprise) site key for `yuvalbigel-p.github.io`. Calls only work from the live site (not localhost/preview).

## Testing notes

- Unit tests cover logic only. UI was verified with playwright-core driving system Chrome against `npx vite preview` (not committed); there is no way to test on a real iPhone from here, so be explicit about that when reporting.
- macOS has no `timeout`; use `perl`/`python` for scripted edits.

## Known open issue

- Owner reported "numbers set in the should list become n+1 in the home check" — not reproducible in Chrome (mouse/touch emulation). Need a concrete example (item, value set, value shown, screen) or a real-device repro before changing anything.
