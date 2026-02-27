import * as exec from '@actions/exec';

export const VCLUSTER_COMMAND = process.platform === 'win32' ? 'vcluster.exe' : 'vcluster';

export async function executeVClusterCommand(args: string[]): Promise<void> {
  await exec.exec(VCLUSTER_COMMAND, args);
}

export async function executeVClusterCommandWithOutput(args: string[]): Promise<string> {
  let output = '';
  await exec.exec(VCLUSTER_COMMAND, args, {
    listeners: {
      stdout: (data: Buffer) => {
        output += data.toString();
      },
    },
  });
  return output.trim();
}
