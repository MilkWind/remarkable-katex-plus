"use strict";

/**
 * Plugin for Remarkable Markdown processor which transforms $..$ and $$..$$ sequences into math HTML using the
 * Katex package.
 */
const rkatex = (md, options) => {
  const dollar = '$';
  const opts = options || {};
  const delimiter = opts.delimiter || dollar;
  if (delimiter.length !== 1) { throw new Error('invalid delimiter'); }

  // Import all utilities including conversion functions
  const { renderKatex, parseBlockKatex, parseInlineKatex } = require('./katex-utils');

  // Extract styling configuration (kept for backward compatibility)
  const stylingConfig = {
    useTailwind: opts.useTailwind || false,
    // Add other styling options here as needed
  };

  /**
   * Wrapper for block KaTeX parsing
   */
  const parseBlockKatexWrapper = (state, startLine, endLine) => {
    return parseBlockKatex(state, startLine, endLine, delimiter);
  };

  /**
   * Wrapper for inline KaTeX parsing
   */
  const parseInlineKatexWrapper = (state, silent) => {
    return parseInlineKatex(state, silent, delimiter);
  };

  md.inline.ruler.push('katex', parseInlineKatexWrapper, options);
  md.block.ruler.push('katex', parseBlockKatexWrapper, options);
  md.renderer.rules.katex = (tokens, idx) => {
    const token = tokens[idx];
    const rendered = renderKatex(token.content, token.block, stylingConfig);
    // Return clean HTML without any markdown artifacts
    return rendered;
  };
  md.renderer.rules.katex.delimiter = delimiter;
};

module.exports = rkatex;
