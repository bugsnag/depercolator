# Depercolator
This tool is a swiss army knife for converting coffeescript files to
javascript. It relies on several other tools to ease the conversion process and create idiomatic javascript and JSX.

- [cjsx-transform](https://github.com/jsdf/coffee-react-transform) for adding jsx support to decaffeinate
- [decaffeinate](https://github.com/decaffeinate/decaffeinate) converts coffeescript to idiomatic javascript
- [react-codemod](https://github.com/reactjs/react-codemod) for converting `React.createElement` calls back to JSX
* [prettier](https://github.com/jlongster/prettier) For final formatting and cleanup
* [ESLint](http://eslint.org) Optional step to make resulting code match your own style conventions.


## Instalation

```
npm i -g depercolator
```

or

```
yarn add global depercolator
```

## Usage

```
depercolate <file> [options]
```

## Options
- `-o, --output [filepath]`: Change path of resulting file (defaults to same
  path as original with a different extension)
- `-e, --eslint-fix`: Perform eslint --fix on resulting file (requires that eslint be present)
- `--skip-prettier`: Do not reformat the file with prettier (default is false)

## Decaffeinate options

Most options from [decaffeinate](https://github.com/decaffeinate/decaffeinate#options) can be passed through to the underlying
command

- `--prefer-const`: Use `const` when converting from coffeescript
- `--keep-commonjs`: Do not convert require and module.exports to import and export
- `--prefer-const`: Use "const" when possible in output code
- `--loose-default-params`: Convert CS default params to JS default params.
- `--loose-for-expressions`: Do not wrap expression loop targets in Array.from
- `--loose-for-of`: Do not wrap JS for...of loop targets in Array.from
- `--loose-includes`: Do not wrap in Array.from when converting in to includes
- `--allow-invalid-constructors`: Don't error when constructors use this before super or omit the super call in a subclass.
- `--enable-babel-constructor-workaround`: Use a hacky babel-specific workaround to allow this before super in constructors.

## Prettier options

Most options from [prettier](https://github.com/jlongster/prettier#api) can be passed through to
the underlying command


- `--print-width <int>`: Specify the length of line that the formatter will wrap on. Defaults to 80.
- `--tab-width <int>`: Specify the number of spaces per indentation-level. Defaults to 2.
- `--single-quote`: Use single quotes instead of double.
- `--trailing-comma`: Print trailing commas wherever possible.
- `--bracket-spacing`: Put spaces between brackets. Defaults to true.
- `--parser <flow|babylon>`: Specify which parse to use. Defaults to babylon.
