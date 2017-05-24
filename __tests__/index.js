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
  const source = path.resolve(`./fixtures/${filename}`);
  const outputPath = mapExtension(source);
  const { stderr } = await execAsync(`${COMMAND} ${flags} ${source}`);

  if (stderr) {
    throw stderr;
  }

  const result = await fs.readFile(outputPath, 'utf8');
  fs.unlink(outputPath);
  return result;
}

describe('happy test', () => {
  it('converts the file', async () => {
    const result = await run('testfile.cjsx');
    expect(result).toMatchSnapshot();
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
