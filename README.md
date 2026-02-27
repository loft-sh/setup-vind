# setup-vind

GitHub Action to provision Kubernetes clusters via [vCluster's Docker driver (vind)](https://github.com/loft-sh/vind). Drop-in replacement for [setup-kind](https://github.com/loft-sh/setup-kind).

## Usage

```yaml
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: loft-sh/setup-vind@v1
        with:
          version: v0.31.0
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

**Post step:** exports container logs as GitHub artifact → deletes cluster (`vcluster delete`)

## Migrating from setup-kind

| setup-kind | setup-vind | Notes |
|------------|------------|-------|
| `version: v0.30.0` | `version: v0.31.0` | vCluster CLI version, not KinD |
| `image: kindest/node:v1.35.0` | `kubernetes-version: "1.35.0"` | No node image needed |
| `config: kind.yaml` | `config: vcluster.yaml` | Different config format |
| `kind load docker-image` | *(not needed)* | Docker images available natively |

## License

MIT
