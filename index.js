#!/usr/bin/env node
var chalk = require('chalk');
var path = require('path');
var program = require('commander');
var shell = require('shelljs');
var resolveBin = require('resolve-bin');

var decafPath = resolveBin.sync('decaffeinate');
var prettierPath = resolveBin.sync('prettier');
var jscodeshiftPath = resolveBin.sync('jscodeshift');
var cjsxTransformPath = resolveBin.sync('coffee-react-transform', { executable: 'cjsx-transform' });
var rceToJSXPath = path.resolve(__dirname,'./node_modules/react-codemod/transforms/create-element-to-jsx.js');

shell.config.silent = true;
shell.config.fatal = true;

function decaffeinateCommand() {
  var command = [ decafPath ];

  if (program.preferConst) {
    command.push('--prefer-const');
  }

  return command.join(' ');
}

function cjsxTransformCommand(file) {
  return [ cjsxTransformPath, file ].join(' ');
}

function jsCodeShiftCommand(file) {
  return [jscodeshiftPath, '-t', rceToJSXPath, file].join(' ');
}

function makeOutput(file) {
  return file.replace(/.cjsx$/, '.jsx').replace(/.coffee$/, '.js');
}

function renderError(message) {
  console.log("\n");
  console.log(chalk.bgRed('ERROR:') + ' ' + chalk.red(message));
}

function renderSuccess(message) {
  console.log("\n");
  console.log(chalk.bgGreen.black.bold('DONE:') + ' ' + chalk.green(message));
}

function processFile(file) {
  var output = program.output || makeOutput(file);
  shell
    .exec(cjsxTransformCommand(file))
    .exec(decaffeinateCommand())
    .to(output);

  // convert React.createElement to jsx
  shell.exec(jsCodeShiftCommand(output));

  // prettier
  shell.exec(prettierPath + ' --write ' + output);

  if (program.eslintFix) {
    if (!shell.which('eslint')) {
      renderError('eslint must be present when specifying --eslint-fix');
      shell.exit(1);
    }
    shell.exec('eslint --fix ' + output)
  }

  renderSuccess('Converted ' + file + chalk.bold.white(' → ') + output);
}

program
  .arguments('<file>')
  .option('--prefer-const', 'Use "const" when possible in output code')
  .option('-o, --output [filepath]', 'Output file path')
  .option('-e, --eslint-fix', 'Perform eslint --fix on resulting file')
  .action(processFile)
  .parse(process.argv);
