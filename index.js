#!/usr/bin/env node
const chalk = require('chalk');
const path = require('path');
const program = require('commander');
const shell = require('shelljs');
const resolveBin = require('resolve-bin');

const decafPath = resolveBin.sync('decaffeinate');
const prettierPath = resolveBin.sync('prettier');
const jscodeshiftPath = resolveBin.sync('jscodeshift');
const cjsxTransformPath = resolveBin.sync('coffee-react-transform', { executable: 'cjsx-transform' });
const rceToJSXPath = path.resolve(__dirname, './node_modules/react-codemod/transforms/create-element-to-jsx.js');

shell.config.fatal = true;

function decaffeinateCommand() {
  const command = [decafPath];

  if (program.preferConst) {
    command.push('--prefer-const');
  }

  return command.join(' ');
}

function cjsxTransformCommand(file) {
  return [cjsxTransformPath, file].join(' ');
}

function jsCodeShiftCommand(file) {
  return [jscodeshiftPath, '-t', rceToJSXPath, file].join(' ');
}

function makeOutput(file) {
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
  const output = program.output || makeOutput(file);
  shell
    .exec(cjsxTransformCommand(file))
    .exec(decaffeinateCommand())
    .to(output);

  // convert React.createElement to jsx
  shell.exec(jsCodeShiftCommand(output));

  // prettier
  shell.exec(`${prettierPath} --write ${output}`);

  if (program.eslintFix) {
    if (!shell.which('eslint')) {
      renderError('eslint must be present when specifying --eslint-fix');
      shell.exit(1);
    }
    shell.exec(`eslint --fix ${output}`);
  }

  renderSuccess(`Converted ${file}${chalk.bold.white(' → ')}${output}`);
}

program
  .arguments('<file>')
  .option('--prefer-const', 'Use "const" when possible in output code')
  .option('-o, --output [filepath]', 'Output file path')
  .option('-e, --eslint-fix', 'Perform eslint --fix on resulting file')
  .action(processFile)
  .parse(process.argv);
