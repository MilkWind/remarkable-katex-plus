/**
 * Utility functions for post-processing KaTeX rendered HTML
 */

const katex = require("katex");

/**
 * Render the contents as KaTeX
 * @param {string} source - The LaTeX source to render
 * @param {boolean} displayMode - Whether to render in display mode
 * @param {Object} stylingConfig - Styling configuration
 * @returns {string} - Rendered HTML
 */
function renderKatex(source, displayMode, stylingConfig = {}) {
  const rendered = katex.renderToString(source, {
    displayMode: displayMode,
    throwOnError: false
  });
  
  // Always apply custom styling to process aria-hidden elements
  return applyCustomStyling(rendered, stylingConfig);
}

/**
 * Parse '$$' as a block. Based off of similar method in remarkable.
 * @param {Object} state - Parser state
 * @param {number} startLine - Starting line number
 * @param {number} endLine - Ending line number
 * @param {string} delimiter - The delimiter character ($ or custom)
 * @returns {boolean} - Whether parsing was successful
 */
function parseBlockKatex(state, startLine, endLine, delimiter) {
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
}

/**
 * Look for '$' or '$$' spans in Markdown text. Based off of the 'fenced' parser in remarkable.
 * @param {Object} state - Parser state
 * @param {boolean} silent - Whether to run in silent mode
 * @param {string} delimiter - The delimiter character ($ or custom)
 * @returns {boolean} - Whether parsing was successful
 */
function parseInlineKatex(state, silent, delimiter) {
  const backslash = '\\';
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
}

/**
 * Process elements with aria-hidden="true" by removing inline class and adding display:none style
 * @param {string} htmlContent - The HTML content to process
 * @param {Object} config - Configuration object (kept for backward compatibility)
 * @returns {string} - Processed HTML content
 */
function processAriaHidden(htmlContent, config = {}) {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return htmlContent;
  }

  // Match elements with aria-hidden="true"
  const ariaHiddenRegex = /<([a-zA-Z][a-zA-Z0-9]*)\s+([^>]*?)aria-hidden=["']true["']([^>]*?)>/gi;
  
  return htmlContent.replace(ariaHiddenRegex, (match, tagName, beforeAttrs, afterAttrs) => {
    const fullAttrs = beforeAttrs + afterAttrs;
    let processedMatch = match;
    
    // Remove inline class if present in class attribute
    const classMatch = fullAttrs.match(/class=["']([^"']*)["']/);
    if (classMatch) {
      let existingClasses = classMatch[1];
      const filteredClasses = existingClasses
        .split(' ')
        .filter(cls => cls.trim() && cls !== 'inline')
        .join(' ');
      
      if (filteredClasses !== existingClasses) {
        if (filteredClasses) {
          processedMatch = processedMatch.replace(/class=["']([^"']*)["']/, `class="${filteredClasses}"`);
        } else {
          // Remove empty class attribute
          processedMatch = processedMatch.replace(/\s*class=["'][^"']*["']/, '');
        }
      }
    }
    
    // Check if style attribute already exists
    const styleMatch = fullAttrs.match(/style=["']([^"']*)["']/);
    
    if (styleMatch) {
      // Style attribute exists, append display:none if not already present
      const existingStyle = styleMatch[1];
      if (!existingStyle.includes('display:none') && !existingStyle.includes('display: none')) {
        const newStyle = existingStyle.endsWith(';') ? 
          `${existingStyle} display:none` : 
          `${existingStyle}; display:none`;
        processedMatch = processedMatch.replace(/style=["']([^"']*)["']/, `style="${newStyle}"`);
      }
    } else {
      // No style attribute, add one with display:none
      processedMatch = processedMatch.replace(/>$/, ` style="display:none">`);
    }
    
    return processedMatch;
  });
}

/**
 * Apply custom styling configuration to rendered KaTeX HTML
 * @param {string} htmlContent - The rendered HTML content
 * @param {Object} config - Configuration object
 * @returns {string} - Processed HTML content
 */
function applyCustomStyling(htmlContent, config = {}) {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return htmlContent;
  }

  let processedContent = htmlContent;

  // Process aria-hidden elements
  processedContent = processAriaHidden(processedContent, config);

  return processedContent;
}

module.exports = {
  renderKatex,
  parseBlockKatex,
  parseInlineKatex,
  processAriaHidden,
  applyCustomStyling
};
