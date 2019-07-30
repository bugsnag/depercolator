#!/usr/bin/env node
import fs from 'fs';
import coffeeReactTransform from 'coffee-react-transform';
import { convert as decaf } from 'decaffeinate';
import { transform as babelTransform } from 'babel-core';
import camelCase from 'lodash/camelCase';
import chalk from 'chalk';
import program from 'commander';
import prettier from 'prettier-eslint';

// pass through options
const decaffeinateOptions = [
  [
    '--modernize-js',
    'Treat the input as JavaScript and only run the JavaScript-to-JavaScript transforms, modifying the file(s) in-place.',
  ],
  ['--literate', 'Treat the input file as Literate CoffeeScript.'],
  [
    '--disable-suggestion-comment',
    'Do not include a comment with followup suggestions at the top of the output file.',
  ],
  ['--no-array-includes', 'Do not use Array.prototype.includes in generated code.'],
  ['--use-optional-chaining', 'Use the upcoming optional chaining syntax for operators like ?..'],
  ['--use-js-modules', 'Convert require and module.exports to import and export.'],
  ['--loose-js-modules', 'Allow named exports when converting to JS modules.'],
  [
    '--safe-import-function-identifiers',
    'Comma-separated list of function names that may safely be in the import/require section of the file. All other function calls will disqualify later requires from being converted to imports.',
  ],
  ['--prefer-let', 'Use let instead of const for most variables in output code.'],
  ['--loose', 'Enable all --loose... options.'],
  ['--loose-default-params', 'Convert CS default params to JS default params.'],
  ['--loose-for-expressions', 'Do not wrap expression loop targets in Array.from.'],
  ['--loose-for-of', 'Do not wrap JS for...of loop targets in Array.from.'],
  ['--loose-includes', 'Do not wrap in Array.from when converting in to includes.'],
  ['--loose-comparison-negation', 'Allow unsafe simplifications like !(a > b) to a <= b.'],
  [
    '--disable-babel-constructor-workaround',
    'Never include the Babel/TypeScript workaround code to allow this before super in constructors.',
  ],
  [
    '--disallow-invalid-constructors',
    'Give an error when constructors use this before super or omit the super call in a subclass.',
  ],
];

const prettierOptions = [
  ['--no-bracket-spacing', 'Do not print spaces between brackets.'],
  ['--jsx-bracket-same-line', 'Put > on the last line instead of at a new line.'],
  ['--parser <flow|babylon|typescript|css|less|scss|json|graphql|markdown>', 'Which parser to use'],
  ['--print-width <int>', 'The line length where Prettier will try wrap'],
  ['--no-prose-wrap', 'Do not wrap prose. (markdown)'],
  ['--no-semi', 'Do not print semicolons, except at the beginning of lines which may need them.'],
  ['--single-quote', 'Use single quotes instead of double quotes.'],
  ['--tab-width <int>', 'Number of spaces per indentation level.'],
  ['--trailing-comma <none|es5|all>', 'Print trailing commas wherever possible when multi-line.'],
  ['--use-tabs', 'Indent with tabs instead of spaces.'],
];

function getOptions(array) {
  const options = {};
  array.forEach(([flag]) => {
    const key = camelCase(flag.replace(' <int>', ''));
    let value = program[key];

    if (/<int>/.test(flag) && typeof value === 'string') {
      value = parseInt(value, 10);
    }
    // decaffinate does not camelCase Js in --use-js-modules or --loose-js-modules
    if (key === 'useJsModules')
      options['useJSModules'] = value;
    else if (key === 'looseJsModules')
      options['looseJSModules'] = value;
    else
      options[key] = value
  });

  return options;
}

function makeOutputPath(file) {
  return file.replace(/.cjsx$/, '.jsx').replace(/.coffee$/, '.js');
}

function renderError({ message, label = 'ERROR:' }) {
  console.log('\n');
  console.log(`${chalk.bgRed(`${label}:`)} ${chalk.red(message)}`);
}

function renderSuccess(message) {
  console.log('\n');
  console.log(`${chalk.bgGreen.black.bold('DONE:')} ${chalk.green(message)}`);
}

function processFile(file) {
  const output = program.output || makeOutputPath(file);
  let result = '';

  // transform cjsx to plain coffeescript
  try {
    result = coffeeReactTransform(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    renderError({ label: 'CJSX Transform Error', message: e });
    process.exit(1);
  }

  // transform coffeescript to javascript
  try {
    result = decaf(result, getOptions(decaffeinateOptions)).code;
  } catch (e) {
    renderError({ label: 'Decaffeinate Error', message: e });
    process.exit(1);
  }

  // convert React.createElement to jsx
  try {
    result = babelTransform(result, {
      babelrc: false,
      plugins: [require.resolve('babel-plugin-transform-react-createelement-to-jsx')],
    }).code;
  } catch (e) {
    renderError({ label: 'Babel error', message: e });
    process.exit(1);
  }

  // format using prettier and eslint
  if (!program.skipPrettier) {
    try {
      result = prettier({
        text: result,
        prettierOptions: getOptions(prettierOptions),
        filePath: output,
      });
    } catch (e) {
      renderError({ label: 'Prettier error', message: e });
      process.exit(1);
    }
  }

  // write output file
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
