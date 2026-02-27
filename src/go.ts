import os from 'os';

export function goos(): string {
  return process.platform === 'win32' ? 'windows' : process.platform;
}

export function goarch(): string {
  switch (process.arch) {
    case 'x64':
      return 'amd64';
    case 'arm64':
      return os.endianness().toLowerCase() === 'be' ? 'arm64be' : 'arm64';
    default:
      return process.arch;
  }
}
