/**
 * Utility functions for processing Mermaid diagrams in Remarkable
 */

/**
 * Parse Mermaid code blocks (```mermaid ... ```)
 * @param {Object} state - Parser state
 * @param {number} startLine - Starting line number
 * @param {number} endLine - Ending line number
 * @returns {boolean} - Whether parsing was successful
 */
function parseBlockMermaid(state, startLine, endLine) {
  let pos = state.bMarks[startLine] + state.tShift[startLine];
  let max = state.eMarks[startLine];

  // Check if line starts with ```
  if (pos + 3 > max) { return false; }
  
  const marker = state.src.slice(pos, pos + 3);
  if (marker !== '```') { return false; }

  pos += 3;
  
  // Skip whitespace
  while (pos < max && state.src.charCodeAt(pos) === 0x20) { pos++; }
  
  // Check if it's a mermaid block
  const langStart = pos;
  while (pos < max && state.src.charCodeAt(pos) !== 0x20 && state.src.charCodeAt(pos) !== 0x0A) { pos++; }
  
  const lang = state.src.slice(langStart, pos).toLowerCase();
  if (lang !== 'mermaid') { return false; }

  // Find the closing ```
  let nextLine = startLine;
  let haveEndMarker = false;

  for (;;) {
    ++nextLine;
    if (nextLine >= endLine) { break; }

    pos = state.bMarks[nextLine] + state.tShift[nextLine];
    max = state.eMarks[nextLine];

    if (pos < max && state.tShift[nextLine] < state.blkIndent) { break; }

    if (state.src.slice(pos, pos + 3) === '```') {
      haveEndMarker = true;
      break;
    }
  }

  if (!haveEndMarker) { return false; }

  // Extract the content between the markers
  const content = state.getLines(startLine + 1, nextLine, 0, true).trim();
  
  state.line = nextLine + 1;
  state.tokens.push({
    type: 'mermaid',
    content: content,
    lines: [startLine, state.line],
    level: state.level,
    block: true
  });

  return true;
}

/**
 * Alternative approach: Hook into the fence (code block) parser
 * @param {Object} state - Parser state  
 * @param {number} startLine - Starting line number
 * @param {number} endLine - Ending line number
 * @returns {boolean} - Whether parsing was successful
 */
function parseFenceMermaid(state, startLine, endLine) {
  let pos = state.bMarks[startLine] + state.tShift[startLine];
  let max = state.eMarks[startLine];

  // Check if line starts with ```
  if (pos + 3 > max) { return false; }
  
  const marker = state.src.slice(pos, pos + 3);
  if (marker !== '```') { return false; }

  pos += 3;
  
  // Skip whitespace
  while (pos < max && state.src.charCodeAt(pos) === 0x20) { pos++; }
  
  // Get the language identifier
  const langStart = pos;
  while (pos < max && state.src.charCodeAt(pos) !== 0x20 && state.src.charCodeAt(pos) !== 0x0A) { pos++; }
  
  const lang = state.src.slice(langStart, pos).toLowerCase();
  if (lang !== 'mermaid') { return false; }

  // Find the closing ```
  let nextLine = startLine;
  let haveEndMarker = false;

  for (;;) {
    ++nextLine;
    if (nextLine >= endLine) { break; }

    pos = state.bMarks[nextLine] + state.tShift[nextLine];
    max = state.eMarks[nextLine];

    if (pos < max && state.tShift[nextLine] < state.blkIndent) { break; }

    if (state.src.slice(pos, pos + 3) === '```') {
      haveEndMarker = true;
      break;
    }
  }

  if (!haveEndMarker) { return false; }

  // Extract the content between the markers
  const content = state.getLines(startLine + 1, nextLine, 0, true).trim();
  
  state.line = nextLine + 1;
  state.tokens.push({
    type: 'mermaid',
    content: content,
    lines: [startLine, state.line],
    level: state.level,
    block: true
  });

  return true;
}

/**
 * Render Mermaid diagram to HTML
 * @param {string} source - The Mermaid source code
 * @param {Object} options - Rendering options
 * @returns {string} - Rendered HTML
 */
function renderMermaid(source, options = {}) {
  if (typeof source !== 'string') {
    return '<div class="mermaid-error">Invalid Mermaid source</div>';
  }

  // Generate a unique ID for this diagram
  const diagramId = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Create a container div with the mermaid class and unique ID
  // The actual rendering will be handled by mermaid.js on the client side
  // Allow empty content - mermaid.js will handle it
  const htmlContent = `<div class="mermaid" id="${diagramId}">${escapeHtml(source)}</div>`;
  
  // Add initialization script if requested
  if (options.includeScript) {
    return htmlContent + `
<script>
if (typeof mermaid !== 'undefined') {
  mermaid.init(undefined, '#${diagramId}');
}
</script>`;
  }
  
  return htmlContent;
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  
  return text.replace(/[&<>"']/g, (match) => htmlEscapes[match]);
}

/**
 * Apply custom styling to Mermaid containers
 * @param {string} htmlContent - The HTML content to process
 * @param {Object} config - Configuration object
 * @returns {string} - Processed HTML content
 */
function applyMermaidStyling(htmlContent, config = {}) {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return htmlContent;
  }

  let processedContent = htmlContent;

  // Add custom CSS classes if specified
  if (config.customClass) {
    processedContent = processedContent.replace(
      /class="mermaid"/g,
      `class="mermaid ${config.customClass}"`
    );
  }

  // Add custom styles if specified
  if (config.customStyle) {
    processedContent = processedContent.replace(
      /(<div[^>]*class="[^"]*mermaid[^"]*"[^>]*)/g,
      `$1 style="${config.customStyle}"`
    );
  }

  return processedContent;
}

/**
 * Validate Mermaid syntax (basic validation)
 * @param {string} source - The Mermaid source code
 * @returns {Object} - Validation result with isValid and errors
 */
function validateMermaidSyntax(source) {
  if (!source || typeof source !== 'string') {
    return { isValid: false, errors: ['Empty or invalid source'] };
  }

  const errors = [];
  const trimmedSource = source.trim();

  // Basic syntax checks
  if (trimmedSource.length === 0) {
    errors.push('Empty diagram content');
  }

  // Check for common diagram types
  const diagramTypes = [
    'graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 
    'stateDiagram', 'erDiagram', 'journey', 'gantt', 'pie',
    'gitgraph', 'mindmap', 'timeline'
  ];

  const hasValidType = diagramTypes.some(type => 
    trimmedSource.toLowerCase().startsWith(type.toLowerCase())
  );

  if (!hasValidType) {
    errors.push('Unknown or missing diagram type');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

module.exports = {
  parseBlockMermaid,
  parseFenceMermaid,
  renderMermaid,
  escapeHtml,
  applyMermaidStyling,
  validateMermaidSyntax
};
