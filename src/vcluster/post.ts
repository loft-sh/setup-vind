import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as glob from '@actions/glob';
import { DefaultArtifactClient } from '@actions/artifact';
import fs from 'fs';
import path from 'path';
import { v5 as uuidv5 } from 'uuid';
import { Input } from '../constants';
import { executeVClusterCommand } from './core';

export class VindPostService {
  readonly name: string;
  readonly skipClusterDeletion: boolean;
  readonly skipClusterLogsExport: boolean;

  private constructor() {
    this.name = core.getInput(Input.Name) || 'vind';
    this.skipClusterDeletion =
      core.getInput(Input.SkipClusterDeletion).toLowerCase() === 'true';
    this.skipClusterLogsExport =
      core.getInput(Input.SkipClusterLogsExport).toLowerCase() === 'true';
  }

  static getInstance(): VindPostService {
    return new VindPostService();
  }

  deleteCommand(): string[] {
    return ['delete', this.name, '--delete-context=false'];
  }

  private logsDir(): string {
    const runnerTemp = process.env['RUNNER_TEMP'] || '/tmp';
    const hash = uuidv5(`vind/${this.name}/logs`, uuidv5.URL);
    return path.join(runnerTemp, hash);
  }

  private artifactName(): string {
    const job = process.env['GITHUB_JOB'] || 'unknown';
    return `${job}-vind-${this.name}-logs`;
  }

  private async collectLogs(): Promise<void> {
    const dir = this.logsDir();
    fs.mkdirSync(dir, { recursive: true });

    const containers = [
      `vcluster.cp.${this.name}`,
      `vcluster.node.${this.name}`,
    ];

    for (const container of containers) {
      const logFile = path.join(dir, `${container}.log`);
      try {
        let output = '';
        await exec.exec('docker', ['logs', container], {
          listeners: {
            stdout: (data: Buffer) => { output += data.toString(); },
            stderr: (data: Buffer) => { output += data.toString(); },
          },
          ignoreReturnCode: true,
        });
        fs.writeFileSync(logFile, output);
      } catch {
        core.info(`Could not collect logs from ${container}`);
      }
    }
  }

  private async uploadLogs(): Promise<void> {
    const dir = this.logsDir();
    const globber = await glob.create(`${dir}/**/*`);
    const files = await globber.glob();
    if (files.length === 0) {
      core.info('No log files to upload');
      return;
    }

    const artifact = new DefaultArtifactClient();
    await artifact.uploadArtifact(this.artifactName(), files, dir);
    core.info(`Uploaded ${files.length} log files as "${this.artifactName()}"`);
  }

  async exportClusterLogs(): Promise<void> {
    if (this.skipClusterLogsExport) {
      core.info('Skipping cluster logs export');
      return;
    }
    core.info('Exporting cluster logs');
    await this.collectLogs();
    await this.uploadLogs();
  }

  async deleteCluster(): Promise<void> {
    if (this.skipClusterDeletion) {
      core.info('Skipping cluster deletion');
      return;
    }
    core.info(`Deleting vind cluster "${this.name}"`);
    await executeVClusterCommand(this.deleteCommand());
    core.info(`Cluster "${this.name}" deleted`);
  }
}
