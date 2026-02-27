import * as core from '@actions/core';
import * as io from '@actions/io';
import { ok } from 'assert';
import * as go from './go';
import { VindMainService } from './vcluster/main';

async function run() {
  try {
    checkEnvironment();
    const service = VindMainService.getInstance();
    const toolPath = await service.installVCluster();
    core.addPath(toolPath);
    await service.setDockerDriver();
    await service.createCluster();
  } catch (error) {
    core.setFailed((error as Error).message);
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
