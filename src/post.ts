import * as core from '@actions/core';
import { VindPostService } from './vcluster/post';

async function run() {
  try {
    const service = VindPostService.getInstance();
    await service.cleanup();
  } catch (error) {
    core.setFailed((error as Error).message);
  }
}

run();
