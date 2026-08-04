# setup-vind

[![Renovate enabled](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com)

GitHub Action to provision Kubernetes clusters via [vCluster's Docker driver (vind)](https://github.com/loft-sh/vind). Drop-in replacement for [setup-kind](https://github.com/loft-sh/setup-kind).

## Usage

```yaml
jobs:
  e2e:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
        with:
          persist-credentials: false
      - uses: loft-sh/setup-vind@v1
        with:
          version: v0.36.1
          name: my-cluster
      - run: kubectl get nodes
```

### With Kubernetes version

```yaml
- uses: loft-sh/setup-vind@v1
  with:
    kubernetes-version: "1.35.0"
```

### With config file

```yaml
- uses: loft-sh/setup-vind@v1
  with:
    config: hack/vcluster.yaml
```

### Multi-cluster setup

```yaml
- uses: loft-sh/setup-vind@v1
  with:
    name: platform
- uses: loft-sh/setup-vind@v1
  with:
    name: agent
```

## Inputs

| Input | Default | Description |
|-------|---------|-------------|
| `version` | `latest` | vCluster CLI version to install |
| `name` | `vind` | Cluster name |
| `config` | | Path to vcluster.yaml values file (repo-relative) |
| `kubernetes-version` | | Kubernetes version for the cluster |
| `skipClusterDeletion` | `false` | Skip cluster deletion in post step |
| `skipClusterLogsExport` | `false` | Skip log export in post step |

## How it works

**Main step:** installs vCluster CLI → sets Docker driver (`vcluster use driver docker`) → creates cluster (`vcluster create`)

**Post step (success, failure, or cancellation):** exports container logs as a GitHub artifact → deletes the cluster (`vcluster delete`). Cluster deletion still runs if log collection or upload fails. Use the `skipClusterDeletion` and `skipClusterLogsExport` inputs to opt out.

The action intentionally changes the installed vCluster CLI's default driver to Docker. If a later command in the same job must target the vind Kubernetes cluster—for example, `vcluster platform start`—give that command an isolated CLI config instead of inheriting the Docker driver:

```bash
vcluster platform start \
  --config "$RUNNER_TEMP/platform-vcluster-config.json"
```

## Migrating from setup-kind

| setup-kind | setup-vind | Notes |
|------------|------------|-------|
| `version: v0.30.0` | `version: v0.36.1` | vCluster CLI version, not KinD |
| `image: kindest/node:v1.35.0` | `kubernetes-version: "1.35.0"` | No node image needed |
| `config: kind.yaml` | `config: vcluster.yaml` | Different config format |
| `kind load docker-image` | *(not needed)* | Docker images available natively |

## License

Apache-2.0 — see [LICENSE](LICENSE).
