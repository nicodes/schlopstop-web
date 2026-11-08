import assert from 'node:assert/strict';
import {mkdtemp, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import test from 'node:test';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const astro = dirname(fileURLToPath(import.meta.resolve('astro/package.json')));
const {resolveConfig} = await import(pathToFileURL(join(astro, 'dist/core/config/config.js')));
const {createEnvLoader} = await import(pathToFileURL(join(astro, 'dist/env/env-loader.js')));
test('Astro independent env loading honors the actual no-dotenv config and process values', async () => {
  const fixture = await mkdtemp(join(tmpdir(), 'astro-process-env-'));
  const previous = process.env.PUBLIC_PROCESS_ONLY;
  process.env.PUBLIC_PROCESS_ONLY = 'selected-process-input';
  try {
    await writeFile(join(fixture, '.env'), 'PUBLIC_FILE_ONLY=unselected-file-input\nPUBLIC_PROCESS_ONLY=file-override-attempt\n');
    const {astroConfig} = await resolveConfig({root}, 'build');
    assert.equal(astroConfig.vite.envDir, false);
    const config = {...astroConfig, root: pathToFileURL(fixture + '/'), vite: {...astroConfig.vite}};
    const actual = createEnvLoader({mode: 'production', config, useStatic: true}).get();
    assert.equal(actual.PUBLIC_PROCESS_ONLY, 'selected-process-input');
    assert.equal(Object.hasOwn(actual, 'PUBLIC_FILE_ONLY'), false);
    delete config.vite.envDir;
    const control = createEnvLoader({mode: 'production', config, useStatic: true}).get();
    assert.equal(control.PUBLIC_FILE_ONLY, 'unselected-file-input');
    assert.equal(control.PUBLIC_PROCESS_ONLY, 'selected-process-input');
  } finally {
    if (previous === undefined) delete process.env.PUBLIC_PROCESS_ONLY;
    else process.env.PUBLIC_PROCESS_ONLY = previous;
    await rm(fixture, {recursive: true, force: true});
  }
});
