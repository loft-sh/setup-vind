import { goos, goarch } from '../src/go';

describe('goos', () => {
  it('returns a valid os string', () => {
    expect(['linux', 'darwin', 'windows']).toContain(goos());
  });
});

describe('goarch', () => {
  it('returns a valid architecture string', () => {
    expect(['amd64', 'arm64']).toContain(goarch());
  });
});
