import * as cache from '@actions/cache';
import * as core from '@actions/core';
import crypto from 'crypto';
import * as semver from 'semver';
import { VCLUSTER_TOOL_NAME } from './constants';

const CACHE_KEY_PREFIX = `${process.env['RUNNER_OS']}-${process.env['RUNNER_ARCH']}-setup-vind-`;

interface CacheParameters {
  paths: string[];
  primaryKey: string;
}

function cacheKey(version: string): string {
  const platform = `${process.env['RUNNER_OS']}`;
  const arch = `${process.env['RUNNER_ARCH']}`;
  const hash = crypto
    .createHash('sha256')
    .update(`vcluster-${version}-${platform}-${arch}-`)
    .digest('hex');
  return `${CACHE_KEY_PREFIX}${hash}`;
}

function cachePaths(version: string): string[] {
  const cleanVersion = semver.clean(version) || version.replace(/^v/, '');
  return [`${process.env['RUNNER_TOOL_CACHE']}/${VCLUSTER_TOOL_NAME}/${cleanVersion}/`];
}

export async function restoreVClusterCache(version: string): Promise<CacheParameters> {
  const paths = cachePaths(version);
  const primaryKey = cacheKey(version);

  const hitKey = await cache.restoreCache(paths, primaryKey);
  if (hitKey) {
    core.info(`Cache restored from key: ${hitKey}`);
  } else {
    core.info('Cache not found');
  }

  return { paths, primaryKey };
}

export async function saveVClusterCache(parameters: CacheParameters): Promise<void> {
  try {
    await cache.saveCache(parameters.paths, parameters.primaryKey);
  } catch (error) {
    if (error instanceof cache.ValidationError) {
      throw error;
    } else if (error instanceof cache.ReserveCacheError) {
      core.info(`${error.message}`);
    } else {
      core.warning(`${(error as Error).message}`);
    }
  }
}
