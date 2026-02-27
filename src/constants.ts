export enum Input {
  Version = 'version',
  Name = 'name',
  Config = 'config',
  KubernetesVersion = 'kubernetes-version',
  SkipClusterDeletion = 'skipClusterDeletion',
  SkipClusterLogsExport = 'skipClusterLogsExport',
}

export enum Flag {
  Name = '--name',
  Values = '--values',
  Set = '--set',
}

export const VCLUSTER_TOOL_NAME = 'vcluster';
