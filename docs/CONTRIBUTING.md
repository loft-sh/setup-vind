# Contributing

## Setup

Install Node.js 24, then install the locked dependencies:

```bash
git clone https://github.com/loft-sh/setup-vind.git
cd setup-vind
npm ci
```

## Development

```bash
npm run lint      # lint TypeScript
npm run typecheck # type-check without emitting files
npm test          # run tests
npm run build     # bundle with esbuild
```

## Architecture

Two-phase GitHub Action lifecycle:

```
main.ts                          post.ts
  │                                │
  ├─ checkEnvironment()            ├─ exportClusterLogs()
  ├─ installVCluster()             │   ├─ docker logs → files
  ├─ setDockerDriver()             │   └─ upload artifact
  └─ createCluster()               └─ deleteCluster()
      ├─ vcluster create
      └─ vcluster connect
```

### Source layout

| File | Purpose |
|------|---------|
| `src/main.ts` | Main entry — env check, install, create |
| `src/post.ts` | Post entry — logs, cleanup |
| `src/constants.ts` | Input/Flag enums |
| `src/go.ts` | Platform/arch mapping |
| `src/cache.ts` | GitHub Actions cache layer |
| `src/vcluster/core.ts` | CLI execution wrapper |
| `src/vcluster/main.ts` | VindMainService — install + create logic |
| `src/vcluster/post.ts` | VindPostService — logs + delete logic |

### Build

Bundled with `esbuild` into two self-contained Node.js 24 files:
- `dist/main/index.js` — main action
- `dist/post/index.js` — post action

**Always commit dist/ changes.** The `check-dist` CI job verifies bundles match source.
