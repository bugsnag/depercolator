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

  if (program.keepCommonjs) {
    command.push('--keep-commonjs');
  }

  if (program.preferConst) {
    command.push('--prefer-const');
  }

  if (program.looseDefaultParams) {
    command.push('--loose-default-params');
  }

  if (program.looseForExpressions) {
    command.push('--loose-for-expressions');
  }

  if (program.looseForOf) {
    command.push('--loose-for-of');
  }

  if (program.looseIncludes) {
    command.push('--loose-includes');
  }

  if (program.allowInvalidConstructors) {
    command.push('--allow-invalid-constructors');
  }

  if (program.enableBabelConstructorWorkaround) {
    command.push('--enable-babel-constructor-workaround');
  }

  return command.join(' ');
}

function prettierCommand(file) {
  const command = [`${prettierPath} --write`]

  if (program.printWidth) {
    command.push(`--print-width ${program.printWidth}`)
  }

  if (program.tabWidth) {
    command.push(`--tab-width ${program.tabWidth}`)
  }

  if (program.singleQuote) {
    command.push(`--single-quote`)
  }

  if (program.trailingComma) {
    command.push(`--trailing-comma`)
  }

  if (program.bracketSpacing) {
    command.push(`--backet-spacing`)
  }

  if (program.parser) {
    command.push(`--parser ${program.parser}`)
  }

  return command.concat(file).join(' ');
}

function cjsxTransformCommand(file) {
  return [cjsxTransformPath, file].join(' ');
}

function jsCodeShiftCommand(file) {
  return [jscodeshiftPath, '-t', rceToJSXPath, file].join(' ');
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
  shell.exec(prettierCommand(output));

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
  .option('-o, --output [filepath]', 'Output file path')
  .option('-e, --eslint-fix', 'Perform eslint --fix on resulting file')
  // decaffeinate options
  .option('--keep-commonjs', 'Do not convert require and module.exports to import and export')
  .option('--prefer-const', 'Use "const" when possible in output code')
  .option('--loose-default-params', 'Convert CS default params to JS default params.')
  .option('--loose-for-expressions', 'Do not wrap expression loop targets in Array.from')
  .option('--loose-for-of', 'Do not wrap JS for...of loop targets in Array.from')
  .option('--loose-includes', 'Do not wrap in Array.from when converting in to includes')
  .option('--allow-invalid-constructors', "Don't error when constructors use this before super or omit the super call in a subclass.")
  .option('--enable-babel-constructor-workaround', 'Use a hacky babel-specific workaround to allow this before super in constructors.')
  // prettier options
  .option('--print-width <int>', 'Specify the length of line that the formatter will wrap on. Defaults to 80.')
  .option('--tab-width <int>', 'Specify the number of spaces per indentation-level. Defaults to 2.')
  .option('--single-quote', 'Use single quotes instead of double.')
  .option('--trailing-comma', 'Print trailing commas wherever possible.')
  .option('--bracket-spacing', 'Put spaces between brackets. Defaults to true.')
  .option('--parser <flow|babylon>', 'Specify which parse to use. Defaults to babylon.')
  .action(processFile)
  .parse(process.argv);
