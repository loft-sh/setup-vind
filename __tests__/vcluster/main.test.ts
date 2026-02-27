import { VindMainService } from '../../src/vcluster/main';

const DEFAULTS = {
  INPUT_VERSION: 'v0.31.0',
  INPUT_NAME: 'test-cluster',
  INPUT_CONFIG: '',
  'INPUT_KUBERNETES-VERSION': '',
  INPUT_SKIPCLUSTERDELETION: 'false',
  INPUT_SKIPCLUSTERLOGSEXPORT: 'false',
  GITHUB_WORKSPACE: '/github/workspace',
  GITHUB_JOB: 'e2e',
  RUNNER_ARCH: 'X64',
  RUNNER_OS: 'Linux',
  RUNNER_TEMP: '/tmp/runner',
  RUNNER_TOOL_CACHE: '/tmp/tool-cache',
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

describe('VindMainService', () => {
  beforeEach(() => setEnv());
  afterEach(() => clearEnv());

  it('parses inputs correctly', () => {
    const service = VindMainService.getInstance();
    expect(service.version).toBe('v0.31.0');
    expect(service.name).toBe('test-cluster');
    expect(service.configFile).toBe('');
    expect(service.kubernetesVersion).toBe('');
  });

  it('builds create command with defaults', () => {
    const service = VindMainService.getInstance();
    expect(service.createCommand()).toEqual([
      'create',
      'test-cluster',
      '--connect=false',
    ]);
  });

  it('builds create command with config file', () => {
    setEnv({ INPUT_CONFIG: 'hack/vcluster.yaml' });
    const service = VindMainService.getInstance();
    expect(service.createCommand()).toEqual([
      'create',
      'test-cluster',
      '--connect=false',
      '--values',
      '/github/workspace/hack/vcluster.yaml',
    ]);
  });

  it('builds create command with kubernetes version', () => {
    setEnv({ 'INPUT_KUBERNETES-VERSION': '1.31.0' });
    const service = VindMainService.getInstance();
    const cmd = service.createCommand();
    expect(cmd).toContain('--set');
    expect(cmd).toContain(
      'controlPlane.distro.k3s.image.tag=v1.31.0-k3s1',
    );
  });

  it('builds create command with config and k8s version', () => {
    setEnv({
      INPUT_CONFIG: 'test/values.yaml',
      'INPUT_KUBERNETES-VERSION': 'v1.30.0',
    });
    const service = VindMainService.getInstance();
    const cmd = service.createCommand();
    expect(cmd).toEqual([
      'create',
      'test-cluster',
      '--connect=false',
      '--values',
      '/github/workspace/test/values.yaml',
      '--set',
      'controlPlane.distro.k3s.image.tag=v1.30.0-k3s1',
    ]);
  });

  it('builds connect command', () => {
    const service = VindMainService.getInstance();
    expect(service.connectCommand()).toEqual([
      'connect',
      'test-cluster',
      '--update-current',
    ]);
  });
});
