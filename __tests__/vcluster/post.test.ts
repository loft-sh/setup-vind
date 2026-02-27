import { VindPostService } from '../../src/vcluster/post';

const DEFAULTS = {
  INPUT_NAME: 'test-cluster',
  INPUT_SKIPCLUSTERDELETION: 'false',
  INPUT_SKIPCLUSTERLOGSEXPORT: 'false',
  GITHUB_JOB: 'e2e',
  RUNNER_TEMP: '/tmp/runner',
};

function setEnv(overrides: Record<string, string> = {}) {
  const env = { ...DEFAULTS, ...overrides };
  for (const [key, value] of Object.entries(env)) {
    process.env[key] = value;
  }
}

function clearEnv() {
  for (const key of Object.keys(DEFAULTS)) {
    delete process.env[key];
  }
}

describe('VindPostService', () => {
  beforeEach(() => setEnv());
  afterEach(() => clearEnv());

  it('parses inputs correctly', () => {
    const service = VindPostService.getInstance();
    expect(service.name).toBe('test-cluster');
    expect(service.skipClusterDeletion).toBe(false);
    expect(service.skipClusterLogsExport).toBe(false);
  });

  it('parses skip flags as true', () => {
    setEnv({
      INPUT_SKIPCLUSTERDELETION: 'true',
      INPUT_SKIPCLUSTERLOGSEXPORT: 'true',
    });
    const service = VindPostService.getInstance();
    expect(service.skipClusterDeletion).toBe(true);
    expect(service.skipClusterLogsExport).toBe(true);
  });

  it('builds delete command', () => {
    const service = VindPostService.getInstance();
    expect(service.deleteCommand()).toEqual([
      'delete',
      'test-cluster',
      '--delete-context=false',
    ]);
  });

  it('uses default name when not provided', () => {
    setEnv({ INPUT_NAME: '' });
    const service = VindPostService.getInstance();
    expect(service.name).toBe('vind');
    expect(service.deleteCommand()).toEqual([
      'delete',
      'vind',
      '--delete-context=false',
    ]);
  });
});
