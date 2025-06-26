[![CI](https://github.com/bradhowes/remarkable-katex/workflows/CI/badge.svg)](https://github.com/bradhowes/remarkable-katex)
[![License: MIT](https://img.shields.io/badge/License-MIT-A31F34.svg)](https://opensource.org/licenses/MIT)

This is a fork of [remarkable-katex](https://github.com/bradhowes/remarkable-katex)
by [Brad Howes](https://github.com/bradhowes).

# Overview

This is a [Remarkable](https://github.com/jonschlinkert/remarkable) plugin that converts
[LaTeX math expressions](http://web.ift.uib.no/Teori/KURS/WRK/TeX/symALL.html) between `$...$` (inline) or
`$$...$$` (block) delimiters into math HTML. It should not interfere with any other Markdown processing.

I use this to perform server-side math expression rendering for my blog, [Keystroke
Countdown](https://keystrokecountdown.com). The post
[Metalsmith Plugins for Server-side KaTeX Processing](https://keystrokecountdown.com/articles/metalsmith2/index.html)
talks about the implementation of this package as well as a Jupyter IPython notebook plugin that does
similar processing.

# To Use

Install this package using `npm`:

```bash
% npm install [-s] remarkable-katex katex
```

Assuming you already have `Remarkable` installed, one way to use would be like so:

**CommonJS**

```javascript
const {Remarkable, utils} = require('remarkable');
const plugin = require('remarkable-katex-plus');
const md = new Remarkable();

// Basic usage with default settings
md.use(plugin);

// With custom configuration
md.use(plugin, {
  delimiter: '$'
});
```

**ES6**

```javascript
import {Remarkable, utils} from 'remarkable';
import rkatex from 'remarkable-katex-plus';

const md = new Remarkable();

// Basic usage with default settings
md.use(rkatex);

// With Tailwind CSS styling
md.use(rkatex, {
  delimiter: '$'
});
```

If you use TypeScript, you can import the plugin with the correct types by steps as follows:

```typescript
// remarkable-katex-plus.d.ts
// create this file in any directory you want, such as "types/remarkable-katex.d.ts"
declare module 'remarkable-katex-plus' {
  const rkatex: (md: Remarkable, options?: { delimiter: string }) => void;
  export = rkatex;
}
```

Then add `"types": ["types/remarkable-katex-plus.d.ts"]` to your `tsconfig.json`

```json
{
  "compilerOptions": {
    "include": [
      "types/remarkable-katex-plus.d.ts"
    ]
  }
}
```

# Configuration

The plugin accepts several configuration options:

## Basic Configuration

```javascript
{
  delimiter: '$'        // 1-character delimiter for KaTeX spans (default: '$')
}
```

### Options

- **`delimiter`** (string): Defines the 1-character delimiter to use when recognizing KaTeX spans. Default is the `$` character.

## Styling Behavior

All elements with `aria-hidden="true"` in the rendered KaTeX output will have:
- `inline` class removed (if present)
- `style="display:none"` added as inline style

## Configuration Examples

### Basic Usage
```javascript
const md = new Remarkable();
md.use(rkatex, {
  delimiter: '$'
});
```

### With Custom Delimiter
```javascript  
const md = new Remarkable();
md.use(rkatex, {
  delimiter: '@'
});
```

# Dependencies

* [KaTeX](https://github.com/Khan/KaTeX) -- performs the rendering of the LaTeX commands.

# Tests

There are a set of [Vows](http://vowsjs.org) in [index.test.js](index.test.js). To run:

```bash
% npm test
```

> **NOTE**: if this fails, there may be a path issue with `vows` executable. See [package.json](package.json).
