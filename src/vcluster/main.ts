import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import fs from 'fs';
import path from 'path';
import * as semver from 'semver';
import * as cache from '../cache';
import { Input, VCLUSTER_TOOL_NAME } from '../constants';
import * as go from '../go';
import { executeVClusterCommand, VCLUSTER_COMMAND } from './core';

export class VindMainService {
  readonly version: string;
  readonly name: string;
  readonly configFile: string;
  readonly kubernetesVersion: string;

  private constructor() {
    this.version = core.getInput(Input.Version) || 'latest';
    this.name = core.getInput(Input.Name) || 'vind';
    this.configFile = core.getInput(Input.Config);
    this.kubernetesVersion = core.getInput(Input.KubernetesVersion);
  }

  static getInstance(): VindMainService {
    return new VindMainService();
  }

  private async resolveVersion(): Promise<string> {
    if (this.version !== 'latest') {
      return this.version.startsWith('v') ? this.version : `v${this.version}`;
    }
    const response = await fetch(
      'https://github.com/loft-sh/vcluster/releases/latest',
      { redirect: 'manual' },
    );
    const location = response.headers.get('location');
    if (!location) {
      throw new Error('Failed to resolve latest vCluster version');
    }
    const matches = /\/tag\/(.*)$/.exec(location);
    if (!matches) {
      throw new Error(`Failed to parse version from redirect: ${location}`);
    }
    return matches[1];
  }

  private checkVersion(version: string): void {
    const clean = semver.clean(version);
    if (!clean) {
      core.warning(`Version "${version}" is not valid semver`);
    }
  }

  private downloadUrl(version: string): string {
    const platform = go.goos();
    const arch = go.goarch();
    return `https://github.com/loft-sh/vcluster/releases/download/${version}/vcluster-${platform}-${arch}`;
  }

  private async downloadVCluster(version: string): Promise<string> {
    const url = this.downloadUrl(version);
    core.info(`Downloading vCluster CLI from ${url}`);
    const downloadPath = await tc.downloadTool(url);
    fs.chmodSync(downloadPath, 0o555);
    const cleanVersion = semver.clean(version) || version.replace(/^v/, '');
    return tc.cacheFile(downloadPath, VCLUSTER_COMMAND, VCLUSTER_TOOL_NAME, cleanVersion);
  }

  async installVCluster(): Promise<string> {
    const version = await this.resolveVersion();
    this.checkVersion(version);
    const cleanVersion = semver.clean(version) || version.replace(/^v/, '');

    const cacheParams = await cache.restoreVClusterCache(version);
    let toolPath = tc.find(VCLUSTER_TOOL_NAME, cleanVersion);

    if (!toolPath) {
      toolPath = await this.downloadVCluster(version);
      await cache.saveVClusterCache(cacheParams);
    }

    core.info(`vCluster CLI ${version} installed`);
    return toolPath;
  }

  createCommand(): string[] {
    const args = ['create', this.name, '--connect=false'];

    if (this.configFile) {
      const workspace = process.env['GITHUB_WORKSPACE'] || '';
      args.push('--values', path.join(workspace, this.configFile));
    }

    if (this.kubernetesVersion) {
      args.push(
        '--set',
        `controlPlane.distro.k3s.image.tag=v${this.kubernetesVersion.replace(/^v/, '')}-k3s1`,
      );
    }

    return args;
  }

  connectCommand(): string[] {
    return ['connect', this.name, '--update-current'];
  }

  async setDockerDriver(): Promise<void> {
    core.info('Setting vCluster driver to docker');
    await executeVClusterCommand(['use', 'driver', 'docker']);
  }

  async createCluster(): Promise<void> {
    core.info(`Creating vind cluster "${this.name}"`);
    await executeVClusterCommand(this.createCommand());
    core.info('Updating kubeconfig');
    await executeVClusterCommand(this.connectCommand());
    core.info(`Cluster "${this.name}" created and kubeconfig updated`);
  }
}
