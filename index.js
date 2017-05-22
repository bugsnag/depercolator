#!/usr/bin/env node
const camelCase = require('lodash/camelCase');
const chalk = require('chalk');
const path = require('path');
const program = require('commander');
const shell = require('shelljs');
const resolveBin = require('resolve-bin');

const nodePath = process.execPath;
const decafPath = resolveBin.sync('decaffeinate');
const prettierPath = resolveBin.sync('prettier');
const jscodeshiftPath = resolveBin.sync('jscodeshift');
const cjsxTransformPath = resolveBin.sync('coffee-react-transform', { executable: 'cjsx-transform' });
const rceToJSXPath = path.resolve(__dirname, './node_modules/react-codemod/transforms/create-element-to-jsx.js');

shell.config.fatal = true;

// pass through options
const decaffeinateOptions = [
  ['--keep-commonjs', 'Do not convert require and module.exports to import and export'],
  ['--prefer-const', 'Use "const" when possible in output code'],
  ['--loose-default-params', 'Convert CS default params to JS default params.'],
  ['--loose-for-expressions', 'Do not wrap expression loop targets in Array.from'],
  ['--loose-for-of', 'Do not wrap JS for...of loop targets in Array.from'],
  ['--loose-includes', 'Do not wrap in Array.from when converting in to includes'],
  ['--allow-invalid-constructors', "Don't error when constructors use this before super or omit the super call in a subclass."],
  ['--enable-babel-constructor-workaround', 'Use a hacky babel-specific workaround to allow this before super in constructors.'],
];

const prettierOptions = [
  ['--print-width <int>', 'Specify the length of line that the formatter will wrap on. Defaults to 80.'],
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

  if (value === undefined) { return ''; }

  return typeof value === 'boolean' ? flag : [flag, value].join(' ');
}

function decaffeinateCommand() {
  const command = [nodePath, decafPath];
  const options = decaffeinateOptions.map(([option]) => passFlag(option));

  return command.concat(options).join(' ');
}

function prettierCommand(file) {
  const command = [nodePath, prettierPath, '--write'];

  const options = prettierOptions.map(([option]) => passFlag(option));

  return stringifyCommand(command.concat(options).concat(file));
}

function cjsxTransformCommand(file) {
  const command = [nodePath, cjsxTransformPath, file];

  return stringifyCommand(command);
}

function jsCodeShiftCommand(file) {
  const command = [nodePath, jscodeshiftPath, '-t', rceToJSXPath, file];

  return stringifyCommand(command);
}

function stringifyCommand(parts) {
  if (process.platform === 'win32') {
    // On Windows, it's common for programs to be installed into "C:\Program Files (x86)\..." which
    // causes issues when trying to run commands - as the space is interpreted as an argument delimiter.
    parts = parts.map(part => {
      // Only quote strings containing a space, and haven't already been quoted
      if (part.indexOf(' ') !== -1 && !/^\".*\"$/.test(part)) {
        return `"${str}"`;
      }
      return part;
    });
  }
  return parts.join(' ');
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
  const output = program.output || makeOutputPath(file);
  shell
    .exec(cjsxTransformCommand(file))
    .exec(decaffeinateCommand())
    .to(output);

  // convert React.createElement to jsx
  shell.exec(jsCodeShiftCommand(output));

  // prettier
  if (!program.skipPrettier) {
    shell.exec(prettierCommand(output));
  }

  if (program.eslintFix) {
    if (!shell.which('eslint')) {
      renderError('eslint must be present when specifying --eslint-fix');
      shell.exit(1);
    }

    // turn off fatal mode
    shell.config.fatal = false;
    shell.exec(`eslint --fix ${output}`);
    shell.config.fatal = true;
  }

  renderSuccess(`Converted ${file}${chalk.bold.white(' → ')}${output}`);
}

program
  .arguments('<file>')
  .option('-o, --output [filepath]', 'Output file path')
  .option('-e, --eslint-fix', 'Perform eslint --fix on resulting file')
  .option('--skip-prettier', 'Do not reformat the file with prettier (default is false)');

// add pass through options
decaffeinateOptions.concat(prettierOptions).forEach(([flag, description]) => {
  program.option(flag, description);
});

program
  .action(processFile)
  .parse(process.argv);
