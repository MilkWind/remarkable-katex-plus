"use strict";

/**
 * Plugin for Remarkable Markdown processor which transforms $..$ and $$..$$ sequences into math HTML using the
 * Katex package.
 */
const rkatex = (md, options) => {
  const backslash = '\\';
  const dollar = '$';
  const opts = options || {};
  const delimiter = opts.delimiter || dollar;
  if (delimiter.length !== 1) { throw new Error('invalid delimiter'); }

  // Import styling utilities
  const { applyCustomStyling } = require('./utils');

  // Extract styling configuration (kept for backward compatibility)
  const stylingConfig = {
    useTailwind: opts.useTailwind || false,
    // Add other styling options here as needed
  };

  const katex = require("katex");

  /**
   * Render the contents as KaTeX
   */
  const renderKatex = (source, displayMode) => {
    const rendered = katex.renderToString(source, {
      displayMode: displayMode,
      throwOnError: false
    });
    
    // Always apply custom styling to process aria-hidden elements
    return applyCustomStyling(rendered, stylingConfig);
  };

  /**
   * Parse '$$' as a block. Based off of similar method in remarkable.
   */
  const parseBlockKatex = (state, startLine, endLine) => {
    let haveEndMarker = false;
    let pos = state.bMarks[startLine] + state.tShift[startLine];
    let max = state.eMarks[startLine];

    if (pos + 1 > max) { return false; }

    const marker = state.src.charAt(pos);
    if (marker !== delimiter) { return false; }

    // scan marker length
    let mem = pos;
    pos = state.skipChars(pos, marker);
    let len = pos - mem;

    if (len !== 2) { return false; }

    // search end of block
    let nextLine = startLine;

    for (; ;) {
      ++nextLine;
      if (nextLine >= endLine) { break; }

      pos = mem = state.bMarks[nextLine] + state.tShift[nextLine];
      max = state.eMarks[nextLine];

      if (pos < max && state.tShift[nextLine] < state.blkIndent) { break; }
      if (state.src.charAt(pos) !== delimiter) { continue; }
      if (state.tShift[nextLine] - state.blkIndent >= 4) { continue; }

      pos = state.skipChars(pos, marker);
      if (pos - mem < len) { continue; }

      pos = state.skipSpaces(pos);
      if (pos < max) { continue; }

      haveEndMarker = true;
      break;
    }

    // Only process if we found a complete block (with end marker)
    if (!haveEndMarker) { return false; }

    // If a fence has heading spaces, they should be removed from its inner block
    len = state.tShift[startLine];
    state.line = nextLine + 1; // Always advance past the end marker
    const content = state.getLines(startLine + 1, nextLine, len, true)
      .replace(/[ \n]+/g, ' ')
      .trim();

    state.tokens.push({
      type: 'katex', params: null, content: content, lines: [startLine, state.line],
      level: state.level, block: true
    });
    return true;
  };

  /**
   * Look for '$' or '$$' spans in Markdown text. Based off of the 'fenced' parser in remarkable.
   */
  const parseInlineKatex = (state, silent) => {
    const start = state.pos;
    const max = state.posMax;
    let pos = start;

    // Unexpected starting character
    if (state.src.charAt(pos) !== delimiter) { return false; }

    ++pos;
    while (pos < max && state.src.charAt(pos) === delimiter) { ++pos; }

    // Capture the length of the starting delimiter -- closing one must match in size
    const marker = state.src.slice(start, pos);
    if (marker.length > 2) { return false; }

    const spanStart = pos;
    let escapedDepth = 0;
    while (pos < max) {
      const char = state.src.charAt(pos);
      if (char === '{' && (pos == 0 || state.src.charAt(pos - 1) != backslash)) {
        escapedDepth += 1;
      } else if (char === '}' && (pos == 0 || state.src.charAt(pos - 1) != backslash)) {
        escapedDepth -= 1;
        if (escapedDepth < 0) { return false; }
      } else if (char === delimiter && escapedDepth === 0) {
        const matchStart = pos;
        let matchEnd = pos + 1;
        while (matchEnd < max && state.src.charAt(matchEnd) === delimiter) { ++matchEnd; }

        if (matchEnd - matchStart === marker.length) {
          if (!silent) {
            const content = state.src.slice(spanStart, matchStart)
              .replace(/[ \n]+/g, ' ')
              .trim();
            state.push({ type: 'katex', content: content, block: marker.length > 1, level: state.level });
          }
          state.pos = matchEnd;
          return true;
        }
      }
      pos += 1;
    }

    // If we reach here, no matching closing delimiter was found
    // Don't add anything to pending and don't advance position to avoid partial rendering
    return false;
  };

  md.inline.ruler.push('katex', parseInlineKatex, options);
  md.block.ruler.push('katex', parseBlockKatex, options);
  md.renderer.rules.katex = (tokens, idx) => {
    const token = tokens[idx];
    const rendered = renderKatex(token.content, token.block);
    // Return clean HTML without any markdown artifacts
    return rendered;
  };
  md.renderer.rules.katex.delimiter = delimiter;
};

module.exports = rkatex;
