import * as core from '@actions/core';
import * as exec from '@actions/exec';
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

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
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
      } catch (error) {
        if (attempt < 3) {
          core.warning(`Version resolution attempt ${attempt} failed: ${(error as Error).message}. Retrying...`);
          await this.sleep(2000);
          continue;
        }
        throw error;
      }
    }
    throw new Error('Failed to resolve latest vCluster version');
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

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async waitForNode(): Promise<void> {
    const timeoutSeconds = 300;
    const pollInterval = 5000;
    const deadline = Date.now() + timeoutSeconds * 1000;

    while (Date.now() < deadline) {
      try {
        let stdout = '';
        await exec.exec('kubectl', ['get', 'nodes', '--no-headers'], {
          silent: true,
          listeners: {
            stdout: (data: Buffer) => {
              stdout += data.toString();
            },
          },
        });
        if (stdout.includes(' Ready')) {
          core.info('Node is ready');
          return;
        }
      } catch {
        // node not registered yet
      }
      await this.sleep(pollInterval);
    }
    throw new Error(`Timed out waiting for node to become Ready (${timeoutSeconds}s)`);
  }

  async createCluster(): Promise<void> {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        core.info(`Creating vind cluster "${this.name}" (attempt ${attempt}/${maxRetries})`);
        await executeVClusterCommand(this.createCommand());
        core.info('Updating kubeconfig');
        await executeVClusterCommand(this.connectCommand());
        core.info('Waiting for node to become ready');
        await this.waitForNode();
        core.info(`Cluster "${this.name}" created and ready`);
        return;
      } catch (error) {
        const msg = (error as Error).message || '';
        if (attempt < maxRetries && msg.includes('Failed to connect to bus')) {
          const delay = attempt * 10000;
          core.warning(`Attempt ${attempt} failed (systemd/dbus race). Cleaning up and retrying in ${delay / 1000}s...`);
          try {
            await executeVClusterCommand(['delete', this.name, '--delete-context=false']);
          } catch {
            // cleanup is best-effort
          }
          await this.sleep(delay);
          continue;
        }
        throw error;
      }
    }
  }
}
