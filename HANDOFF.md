# HANDOFF — SuniPlayer (2026-06-14)

Read this before touching anything. Engram topic `handoff/claude` has the full version.

## Where to work
- **Working dir:** `wt-signalsmith/` (clean monorepo worktree, has `node_modules`, builds). Use this.
- **Work branch:** `feat/signalsmith-engine-recovered` (current tip).
- **`main` = production.** Netlify auto-deploys `main`. Same tree as the work branch.
- The parent repo `SUNIPLAYER_V2/` is on `main` but its **working tree still shows old vanilla files** (cosmetic — do not edit there; it has no monorepo `node_modules`).
- `tmp-test/suniplayer-v1` is broken — ignore.

## Deploy (Netlify, verified via MCP)
- siteId `1521bf20-1d5a-4013-9056-0d1cc305598c` · https://suniplayer.netlify.app
- Builds from root `netlify.toml`: `pnpm install && pnpm --filter @suniplayer/web build` → `apps/web/dist`. Works.
- **To deploy a change:** commit to the work branch in `wt-signalsmith`, then promote its tree to `main`:
  ```bash
  cd SUNIPLAYER_V2
  TREE=$(git rev-parse feat/signalsmith-engine-recovered^{tree})
  NEW=$(git commit-tree "$TREE" -p "$(git rev-parse main)" -m "msg")
  git update-ref refs/heads/main "$NEW" && git push origin main
  ```
  (Graft avoids a force-push; `main` and the work branch share the tree but not history.)
  Future cleanup: collapse to a single branch to stop needing the graft.

## Commands
```bash
cd wt-signalsmith
pnpm -C apps/web exec tsc --noEmit
pnpm -C apps/web test -- --run      # web 199/199
pnpm -C packages/core test -- --run # core 22/22
pnpm -C apps/web build
```

## Pending — multi-device sync (NOT shipped; needs 2 physical devices)
Goal: the leader's chosen track plays on all paired devices, even mid-playback; next track pre-cached (prefetch already done).

Open design decision (why it wasn't shipped blind): when the leader switches track, does it
(a) wait for quorum like everyone (perfect sync, but a gap on the leader), or
(b) keep playing while followers use the NTP offset to seek to the leader's live position (no gap; needs seek-to-leader-pos in `handleRemotePlay`/`handlePositionReport`)? Option (b) likely fits "even while playing" best.

Files: `packages/core/src/network/SyncEnsembleOrchestrator.ts` (`startGlobalPlayback`, `handleRemotePlay`, `handlePositionReport`), `apps/web/src/services/useAudio.ts` (PITCH/TEMPO effect where the leader calls `broadcastTrackChange`). `startGlobalPlayback` is currently only called manually from `SyncPanel.tsx`.

Also pending: confirm sub-10ms start alignment on real devices; verify this session's UI changes on the live site.
