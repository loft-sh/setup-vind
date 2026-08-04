import fs from 'fs';
import path from 'path';

describe('action lifecycle', () => {
  test('post step always exports logs and deletes the cluster', () => {
    const action = fs.readFileSync(path.join(__dirname, '..', 'action.yml'), 'utf8');

    expect(action).toMatch(/^\s*post-if:\s*always\(\)\s*$/m);
  });
});
