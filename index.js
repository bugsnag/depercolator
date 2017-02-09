#!/usr/bin/env node
var program = require('commander');
var shell = require('shelljs');
var resolveBin = require('resolve-bin');


var decafPath = resolveBin.sync('decaffeinate');
var prettierPath = resolveBin.sync('prettier');
var cjsxTransformPath = resolveBin.sync('coffee-react-transform', { executable: 'cjsx-transform' });


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

function makeOutput(file) {
  return file.replace(/.cjsx$/, '.jsx').replace(/.coffee$/, '.js');
}

function processFile(file) {
  var output = program.output || makeOutput(file);
  var result = shell
    .exec(cjsxTransformCommand(file))
    .exec(decaffeinateCommand())
    .exec(prettierPath)
    .to(output);

  console.log('Converted ' + file + ' → ' + output)
}

program
  .arguments('<file>')
  .option('--prefer-const', 'Use "const" when possible in output code')
  .option('-o, --output [filepath]', 'Output file path')
  .action(processFile)
  .parse(process.argv);
