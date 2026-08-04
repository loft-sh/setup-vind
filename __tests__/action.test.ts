import fs from 'fs';
import path from 'path';

describe('action lifecycle', () => {
  const action = fs.readFileSync(path.join(__dirname, '..', 'action.yml'), 'utf8');
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'),
  );

  test('post step always exports logs and deletes the cluster', () => {
    expect(action).toMatch(/^\s*post-if:\s*always\(\)\s*$/m);
  });

  test('action and bundles target the supported Node 24 runtime', () => {
    expect(action).toMatch(/^\s*using:\s*["']node24["']\s*$/m);
    expect(packageJson.scripts['build:main']).toContain('--target=node24');
    expect(packageJson.scripts['build:post']).toContain('--target=node24');
  });
});
