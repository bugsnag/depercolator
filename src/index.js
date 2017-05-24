#!/usr/bin/env node
import path from 'path';
import fs from 'fs';
import { transform as babelTransform } from 'babel-core';
import camelCase from 'lodash/camelCase';
import chalk from 'chalk';
import program from 'commander';
import shell from 'shelljs';
import resolveBin from 'resolve-bin';
import prettier from 'prettier-eslint';

const decafPath = resolveBin.sync('decaffeinate');
const cjsxTransformPath = resolveBin.sync('coffee-react-transform', {
  executable: 'cjsx-transform',
});

shell.config.fatal = true;

// pass through options
const decaffeinateOptions = [
  ['--keep-commonjs', 'Do not convert require and module.exports to import and export'],
  ['--prefer-const', 'Use "const" when possible in output code'],
  ['--loose-default-params', 'Convert CS default params to JS default params.'],
  ['--loose-for-expressions', 'Do not wrap expression loop targets in Array.from'],
  ['--loose-for-of', 'Do not wrap JS for...of loop targets in Array.from'],
  ['--loose-includes', 'Do not wrap in Array.from when converting in to includes'],
  [
    '--allow-invalid-constructors',
    "Don't error when constructors use this before super or omit the super call in a subclass.",
  ],
  [
    '--enable-babel-constructor-workaround',
    'Use a hacky babel-specific workaround to allow this before super in constructors.',
  ],
];

const prettierOptions = [
  [
    '--print-width <int>',
    'Specify the length of line that the formatter will wrap on. Defaults to 80.',
  ],
  ['--tab-width <int>', 'Specify the number of spaces per indentation-level. Defaults to 2.'],
  ['--use-tabs', 'Indent lines with tabs instead of spaces. Defaults to false.'],
  ['--single-quote', 'Use single quotes instead of double.'],
  ['--trailing-comma', 'Print trailing commas wherever possible.'],
  ['--bracket-spacing', 'Put spaces between brackets. Defaults to true.'],
  ['--jsx-bracket-same-line', 'Put > on the last line. Defaults to false.'],
  ['--parser <flow|babylon>', 'Specify which parse to use. Defaults to babylon.'],
];

// transform a parsed commander option back into a cli flag
function passFlag(option) {
  const [flag] = option.split(' ');
  const key = camelCase(flag);
  const value = program[key];

  if (value === undefined) {
    return '';
  }

  return typeof value === 'boolean' ? flag : [flag, value].join(' ');
}

function getOptions(array) {
  const options = {};
  array.forEach(([flag]) => {
    const key = camelCase(flag);
    options[key] = program[key];
  });

  return options;
}

function decaffeinateCommand() {
  const command = [decafPath];
  const options = decaffeinateOptions.map(([option]) => passFlag(option));

  return command.concat(options).join(' ');
}

function cjsxTransformCommand(file) {
  return [cjsxTransformPath, file].join(' ');
}

function makeOutputPath(file) {
  return file.replace(/.cjsx$/, '.jsx').replace(/.coffee$/, '.js');
}

function renderError(message) {
  console.log('\n');
  console.log(`${chalk.bgRed('ERROR:')} ${chalk.red(message)}`);
}

function renderSuccess(message) {
  console.log('\n');
  console.log(`${chalk.bgGreen.black.bold('DONE:')} ${chalk.green(message)}`);
}

function processFile(file) {
  let result = '';
  const output = program.output || makeOutputPath(file);
  const { stdout, stderr } = shell
    .exec(cjsxTransformCommand(file), { silent: true })
    .exec(decaffeinateCommand(), { silent: true });

  if (stderr) {
    renderError(stderr);
  }

  // convert React.createElement to jsx
  result = babelTransform(stdout, {
    babelrc: false,
    plugins: [
      path.resolve(`${__dirname}/../node_modules/babel-plugin-transform-react-createelement-to-jsx`),
    ],
  }).code;

  // prettier
  if (!program.skipPrettier) {
    result = prettier({
      text: result,
      prettierOptions: getOptions(prettierOptions),
      filePath: output,
    });
  }

  fs.writeFile(output, result, {}, () => {
    renderSuccess(`Converted ${file}${chalk.bold.white(' → ')}${output}`);
  });
}

program
  .arguments('<file>')
  .option('-o, --output [filepath]', 'Output file path')
  .option('--skip-prettier', 'Do not reformat the file with prettier (default is false)');

// add pass through options
decaffeinateOptions.concat(prettierOptions).forEach(([flag, description]) => {
  program.option(flag, description);
});

program.action(processFile).parse(process.argv);
