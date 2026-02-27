# Contributing

## Setup

```bash
git clone https://github.com/loft-sh/setup-vind.git
cd setup-vind
npm install
```

## Development

```bash
npm test          # run tests
npm run build     # bundle with ncc
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

Bundled with `@vercel/ncc` into two self-contained files:
- `dist/main/index.js` — main action
- `dist/post/index.js` — post action

**Always commit dist/ changes.** The `check-dist` CI job verifies bundles match source.
