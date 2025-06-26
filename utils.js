/**
 * Utility functions for post-processing KaTeX rendered HTML
 */

/**
 * Process elements with aria-hidden="true" based on configuration
 * @param {string} htmlContent - The HTML content to process
 * @param {Object} config - Configuration object
 * @param {boolean} config.useTailwind - Whether to use Tailwind CSS classes
 * @returns {string} - Processed HTML content
 */
function processAriaHidden(htmlContent, config = {}) {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return htmlContent;
  }

  const { useTailwind = false } = config;

  // Match elements with aria-hidden="true"
  const ariaHiddenRegex = /<([a-zA-Z][a-zA-Z0-9]*)\s+([^>]*?)aria-hidden=["']true["']([^>]*?)>/gi;
  
  return htmlContent.replace(ariaHiddenRegex, (match, tagName, beforeAttrs, afterAttrs) => {
    const fullAttrs = beforeAttrs + afterAttrs;
    
    if (useTailwind) {
      // Tailwind CSS approach: remove inline class and add hidden class
      const classMatch = fullAttrs.match(/class=["']([^"']*)["']/);
      
      if (classMatch) {
        // Class attribute exists, process existing classes
        let existingClasses = classMatch[1];
        
        // Remove "inline" class if present
        existingClasses = existingClasses
          .split(' ')
          .filter(cls => cls.trim() && cls !== 'inline')
          .join(' ');
        
        // Add "hidden" class if not already present
        if (!existingClasses.includes('hidden')) {
          existingClasses = existingClasses ? `${existingClasses} hidden` : 'hidden';
        }
        
        // Replace the class attribute with updated classes
        return match.replace(/class=["']([^"']*)["']/, `class="${existingClasses}"`);
      } else {
        // No class attribute, add one with hidden
        return match.replace(/>$/, ` class="hidden">`);
      }
    } else {
      // Default approach: remove inline class and add display:none inline style
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
    }
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
