"use strict";

/**
 * Plugin for Remarkable Markdown processor which transforms ```mermaid code blocks into Mermaid diagrams.
 */
const rmermaid = (md, options) => {
  const opts = options || {};

  // Import all utilities including conversion functions
  const { parseFenceMermaid, renderMermaid, applyMermaidStyling } = require('./mermaid-utils');

  // Extract Mermaid configuration
  const mermaidConfig = {
    includeScript: opts.includeScript || false,
    customClass: opts.mermaidCustomClass || '',
    customStyle: opts.mermaidCustomStyle || '',
    // Add other Mermaid options here as needed
  };

  /**
   * Wrapper for fence Mermaid parsing
   */
  const parseFenceMermaidWrapper = (state, startLine, endLine) => {
    return parseFenceMermaid(state, startLine, endLine);
  };

  // Register Mermaid parser BEFORE the default fences parser
  // This ensures our Mermaid parser runs before the default code block parser
  md.block.ruler.before('fences', 'mermaid', parseFenceMermaidWrapper, options);

  // Register Mermaid renderer
  md.renderer.rules.mermaid = (tokens, idx) => {
    const token = tokens[idx];
    const rendered = renderMermaid(token.content, mermaidConfig);
    // Apply custom styling if configured
    return applyMermaidStyling(rendered, mermaidConfig);
  };
};

module.exports = rmermaid;
