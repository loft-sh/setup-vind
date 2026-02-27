import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as io from '@actions/io';
import { ok } from 'assert';
import * as go from './go';
import { VindMainService } from './vcluster/main';

async function run() {
  try {
    checkEnvironment();
    await loadKernelModules();
    const service = VindMainService.getInstance();
    const toolPath = await service.installVCluster();
    core.addPath(toolPath);
    await service.setDockerDriver();
    await service.createCluster();
  } catch (error) {
    core.setFailed((error as Error).message);
  }
}

async function loadKernelModules(): Promise<void> {
  core.info('Loading required kernel modules');
  for (const mod of ['overlay', 'bridge', 'br_netfilter']) {
    try {
      await exec.exec('sudo', ['modprobe', mod], { silent: true });
    } catch {
      core.warning(`Could not load kernel module ${mod}`);
    }
  }
  try {
    await exec.exec('sudo', ['sysctl', '-q', '-w', 'net.bridge.bridge-nf-call-iptables=1'], { silent: true });
  } catch {
    core.warning('Could not set bridge-nf-call-iptables');
  }
}

function checkEnvironment() {
  const supportedPlatforms = ['linux/amd64', 'linux/arm64'];
  const platform = `${go.goos()}/${go.goarch()}`;
  ok(supportedPlatforms.includes(platform), `Platform "${platform}" is not supported`);

  const requiredVariables = [
    'GITHUB_JOB',
    'GITHUB_WORKSPACE',
    'RUNNER_ARCH',
    'RUNNER_OS',
    'RUNNER_TEMP',
    'RUNNER_TOOL_CACHE',
  ];
  requiredVariables.forEach((variable) => {
    ok(`${process.env[variable]}`, `Expected ${variable} to be defined`);
  });

  const docker = io.which('docker', false);
  ok(docker, 'Docker is required for vind');
}

run();
