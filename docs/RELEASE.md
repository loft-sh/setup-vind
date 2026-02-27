# Release Process

## Cutting a release

1. Ensure all changes are merged to `main`
2. Create and push a semver tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
3. The `release.yml` workflow runs automatically

## What the workflow does

1. **Builds from source** — `npm ci && npm test && npm run build` to verify the tag is clean
2. **Generates SLSA provenance** — `actions/attest-build-provenance@v2` creates a Sigstore-backed attestation for the dist bundles, proving they were built by this repo's CI
3. **Creates GitHub Release** — with auto-generated release notes (commit diff since last tag)
4. **Updates major version tag** — force-pushes `v1` (or `v2`, etc.) to track the latest release in that major line

## Versioning

Follow [semver](https://semver.org/):

- **Patch** (`v1.0.1`): bug fixes, dependency updates
- **Minor** (`v1.1.0`): new inputs, backwards-compatible features
- **Major** (`v2.0.0`): breaking changes (removed inputs, changed behavior)

The major version tag (`v1`) is the recommended pin for consumers:
```yaml
- uses: loft-sh/setup-vind@v1
```

## Verifying provenance

Consumers can verify that a release was built by this repo's CI:
```bash
gh attestation verify dist/main/index.js --repo loft-sh/setup-vind
```

## Security practices

- **Least-privilege permissions** — CI uses `contents: read`, release adds only `contents: write`, `id-token: write`, `attestations: write`
- **Provenance attestation** — every release gets a Sigstore-backed SLSA attestation
- **check-dist CI job** — verifies dist/ bundles match source on every PR
- **Dependabot** — automated dependency updates (configure in `.github/dependabot.yml`)
- **No secrets in action** — the action only downloads the public vCluster CLI binary; no tokens or credentials are handled

## Pre-release checklist

- [ ] Tests pass locally (`npm test`)
- [ ] dist/ is up to date (`npm run build && git diff dist/`)
- [ ] CHANGELOG entry added (if applicable)
- [ ] Version in package.json updated (optional, informational only)
