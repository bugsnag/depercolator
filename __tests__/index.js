import fs from 'async-file';
import resolveBin from 'resolve-bin';
import { execAsync } from 'async-child-process';
import path from 'path';

const COMMAND = path.resolve('./dist/index.js');

function mapExtension(source) {
  const ext = path.extname(source);
  return `${path.dirname(source)}/${path.basename(source, ext)}.jsx`;
}

async function run(filename, flags = '') {
  const source = path.resolve(filename);
  const outputPath = mapExtension(source);
  await execAsync(`${COMMAND} ${flags} ${source}`);

  const result = await fs.readFile(outputPath, 'utf8');
  fs.unlink(outputPath);
  return result;
}

describe('happy test', () => {
  it('converts the file', async () => {
    const result = await run('./fixtures/testfile.cjsx');
    expect(result).toMatchSnapshot();
  });
});

describe('invalid option', () => {
  it('throws the error', async () => {
    expect.assertions(1);
    await expect(run('./fixtures/badfile.cjsx')).rejects.toBeDefined();
  });
});

describe('decaffeinate options', () => {
  it('supports all of them', async () => {
    const decafPath = resolveBin.sync('decaffeinate');
    const { stdout } = await execAsync(`${decafPath} -h`);
    const flags = stdout.match(/\s-[\w-]+/g);
    expect(flags).toMatchSnapshot();
  });
});

describe('prettier options', () => {
  it('supports all of them', async () => {
    const prettierPath = resolveBin.sync('prettier');
    const { stdout } = await execAsync(`${prettierPath} -h`);
    const flags = stdout.match(/\s-[\w-]+/g);
    expect(flags).toMatchSnapshot();
  });
});

describe('flags with <int>', () => {
  it('cleans the int', async () => {
    const result = await run('./fixtures/testfile.cjsx', '--tab-width 4');
    expect(result).toMatchSnapshot();
  });
});

describe('flag --use-js-modules', () => {
  it('does not camelcase js', async () => {
    const result = await run('./fixtures/testfile.cjsx', '--use-js-modules');
    expect(result).toMatchSnapshot();
  });
});

describe('flag --loose-js-modules', () => {
  it('does not camelcase js', async () => {
    const result = await run('./fixtures/named_export.cjsx', '--loose-js-modules --use-js-modules');
    expect(result).toMatchSnapshot();
  });
});
