# Ease Task Runner TypeScript Plugin

This is a plugin for the [Ease task runner](https://github.com/chisel/ease). It uses the [typescript](https://www.npmjs.com/package/typescript) module to transpile TypeScript files.

# Installation

```
npm install ease-task-typescript --save-dev
```

**easeconfig.js:**
```js
const ts = require('ease-task-typescript');

module.exports = ease => {

  ease.install('transpile-ts', ts, {});

};
```

# Configuration

This plugin takes a config object similar to [TypeScript Compiler Options](https://www.typescriptlang.org/docs/handbook/compiler-options.html) while adding the following properties:
  - `cleanOutDir`: Boolean indicating if the output directory should be emptied first
  - `tsconfig`: A path to the `tsconfig.json` file, relative to `easeconfig.js`
  - `useLocal`: If true, the plugin will use the local TypeScript module instead of the one shipped (defaults to `false`).

> If `tsconfig` is present, all the compiler options will be ignored and loaded from the file instead.
> Keep in mind that `useLocal` will only work when `easeconfig.js` is sitting at the root (sibling to `node_modules`).

# Example

**easeconfig.js:**
```js
const ts = require('ease-task-typescript');

module.exports = ease => {

  ease.install('transpile-ts', ts, {
    cleanOutDir: true,
    tsconfig: 'tsconfig.json'
  });

  ease.job('transpile-ts-files', ['transpile-ts']);

};
```

**CLI:**
```
ease transpile-ts-files
```
