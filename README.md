# Depercolator [![CircleCI](https://circleci.com/gh/bugsnag/depercolator.svg?style=svg)](https://circleci.com/gh/bugsnag/depercolator)

This tool is a swiss army knife for converting coffeescript files to
javascript. It relies on several other tools to ease the conversion process and create idiomatic javascript and JSX.

* [cjsx-transform](https://github.com/jsdf/coffee-react-transform) for adding jsx support to decaffeinate
* [decaffeinate](https://github.com/decaffeinate/decaffeinate) converts coffeescript to idiomatic javascript
* [react-codemod](https://github.com/reactjs/react-codemod) for converting `React.createElement` calls back to JSX
* [prettier-eslint](https://github.com/prettier/prettier-eslint) For final formatting and cleanup

Learn more from our blog on [converting our React codebase from CoffeeScript to ES6](https://blog.bugsnag.com/converting-a-large-react-codebase-from-coffeescript-to-es6/).

## Installation

```text
npm i -g depercolator
```

or

```text
yarn global add depercolator
```

## Usage

```text
depercolate <file> [options]
```

## Options

* `-o, --output [filepath]`: Change path of resulting file (defaults to same
  path as original with a different extension)
* `--skip-prettier`: Do not reformat the file with prettier (default is false)

## Decaffeinate options

Most options from [decaffeinate](https://github.com/decaffeinate/decaffeinate#options) can be passed through to the underlying
command

* `--modernize-js`: Treat the input as JavaScript and only run the JavaScript-to-JavaScript transforms, modifying the file(s) in-place.
* `--literate`: Treat the input file as Literate CoffeeScript.
* `--disable-suggestion-comment`: Do not include a comment with followup suggestions at the top of the output file.
* `--no-array-includes`: Do not use `Array.prototype.includes` in generated code.
* `--use-optional-chaining`: Use the upcoming [optional chaining](https://github.com/tc39/proposal-optional-chaining) syntax for operators like `?.`.
* `--use-js-modules`: Convert `require` and `module.exports` to `import` and `export`.
* `--loose-js-modules`: Allow named exports when converting to JS modules.
* `--safe-import-function-identifiers`: Comma-separated list of function names that may safely be in the `import`/`require` section of the file. All other function calls will disqualify later `require`s from being converted to `import`s.
* `--prefer-let`: Use `let` instead of `const` for most variables in output code.
* `--loose`: Enable all `--loose...` options.
* `--loose-default-params`: Convert CS default params to JS default params.
* `--loose-for-expressions`: Do not wrap expression loop targets in `Array.from`.
* `--loose-for-of`: Do not wrap JS `for...of` loop targets in `Array.from`.
* `--loose-includes`: Do not wrap in `Array.from` when converting `in` to `includes`.
* `--loose-comparison-negation`: Allow unsafe simplifications like `!(a > b)` to `a <= b`.
* `--disable-babel-constructor-workaround`: Never include the Babel/TypeScript workaround code to allow `this` before `super` in constructors.
* `--disallow-invalid-constructors`: Give an error when constructors use `this` before `super` or omit the `super` call in a subclass.

## Prettier options

Most options from [prettier](https://prettier.io/docs/en/options.html) can be passed through to
the underlying command

* `--no-bracket-spacing`: Do not print spaces between brackets.
* `--jsx-bracket-same-line`: Put > on the last line instead of at a new line.
* `--parser <flow|babylon|typescript|css|less|scss|json|graphql|markdown>`: Which parser to use
* `--print-width <int>`: The line length where Prettier will try wrap.
* `--no-prose-wrap`: Do not wrap prose. (markdown)
* `--no-semi`: Do not print semicolons, except at the beginning of lines which may need them.
* `--single-quote`: Use single quotes instead of double quotes.
* `--tab-width <int>`: Number of spaces per indentation level.
* `--trailing-comma <none|es5|all>`: Print trailing commas wherever possible when multi-line.
* `--use-tabs`: Indent with tabs instead of spaces.
