import * as exec from '@actions/exec';

export const VCLUSTER_COMMAND = process.platform === 'win32' ? 'vcluster.exe' : 'vcluster';

export async function executeVClusterCommand(args: string[]): Promise<void> {
  let stderr = '';
  try {
    await exec.exec(VCLUSTER_COMMAND, args, {
      listeners: {
        stderr: (data: Buffer) => {
          stderr += data.toString();
        },
      },
    });
  } catch (error) {
    const msg = stderr
      ? `${(error as Error).message}\n${stderr.trim()}`
      : (error as Error).message;
    throw new Error(msg);
  }
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
