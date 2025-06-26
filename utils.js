/**
 * Utility functions for post-processing KaTeX rendered HTML
 */

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
  processAriaHidden,
  applyCustomStyling
};
