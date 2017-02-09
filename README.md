# Percolate
This tool is a swiss army knife for converting coffeescript files to
javascript. It relies on several other tools to ease the conversion process and create idiomatic javascript and JSX.

- [cjsx-transform](https://github.com/jsdf/coffee-react-transform) for adding jsx support to decaffeinate
- [decaffeinate](https://github.com/decaffeinate/decaffeinate) converts coffeescript to idiomatic javascript
- [react-codemod](https://github.com/reactjs/react-codemod) for converting `React.createElement` calls back to JSX
* [prettier](https://github.com/jlongster/prettier) For final formatting and cleanup
* [ESLint](http://eslint.org) Optional step to make resulting code match your own style conventions.


## Instalation

```
npm i -g percolate
```

or

```
yarn add global percolate
```

## Usage

```
percolate <file> [options]
```

## Options
- `-o, --output [filepath]`: Change path of resulting file (defaults to same
  path as original with different extension)
- `-e, --eslint-fix`: Perform eslint --fix on resulting file (requires that eslint be
  present)
- `--prefer-const`: Use `const` when converting from coffeescript
