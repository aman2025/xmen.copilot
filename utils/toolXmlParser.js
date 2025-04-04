/**
 * Converts tool calls from JSON format to XML format
 * @param {Object} message - The assistant message containing tool calls
 * @returns {string} - The message content with tool calls formatted as XML
 */
export const convertToolCallsToXml = (message) => {
  if (!message.toolCalls || message.toolCalls.length === 0) {
    return message.content || '';
  }

  let xmlContent = message.content || '';
  
  // Add a line break if there's content and it doesn't end with one
  if (xmlContent && !xmlContent.endsWith('\n')) {
    xmlContent += '\n\nI need to use a tool to help with this:';
  } else if (!xmlContent) {
    xmlContent = 'I need to use a tool to help with this:';
  }
  
  // Add a line break before the XML
  xmlContent += '\n\n';

  // Process each tool call and convert to XML format
  message.toolCalls.forEach(toolCall => {
    const { function: toolFunction } = toolCall;
    const { name: toolName, arguments: toolArgs } = toolFunction;
    
    // Parse arguments if they're a string
    const parsedArgs = typeof toolArgs === 'string' 
      ? JSON.parse(toolArgs) 
      : toolArgs;
    
    // Start XML structure with tool name
    xmlContent += `<${toolName}>\n`;
    
    // Add each parameter as an XML tag
    Object.entries(parsedArgs).forEach(([paramName, paramValue]) => {
      xmlContent += `<${paramName}>${paramValue}</${paramName}>\n`;
    });
    
    // Close the tool tag
    xmlContent += `</${toolName}>\n`;
  });
  
  return xmlContent;
};

/**
 * Parses XML-formatted tool calls from a message
 * @param {string} content - The message content containing XML tool calls
 * @returns {Array} - Array of parsed tool calls with name, params, and original XML
 */
export const parseXmlToolCalls = (content) => {
  if (!content || typeof content !== 'string') {
    return [];
  }
  
  const toolCalls = [];
  // Improved regex to better match XML tags across multiple lines
  const toolRegex = /<([a-zA-Z_]+)>\s*([\s\S]*?)\s*<\/\1>/g;
  
  let match;
  while ((match = toolRegex.exec(content)) !== null) {
    const toolName = match[1];
    const toolContent = match[2];
    const originalXml = match[0];
    
    // Skip if this isn't a valid tool name (e.g., it's a parameter tag)
    if (toolName.includes('_')) {
      // Extract parameters
      const params = {};
      const paramRegex = /<([a-zA-Z_]+)>\s*([\s\S]*?)\s*<\/\1>/g;
      
      let paramMatch;
      while ((paramMatch = paramRegex.exec(toolContent)) !== null) {
        const paramName = paramMatch[1];
        const paramValue = paramMatch[2].trim();
        params[paramName] = paramValue;
      }
      
      toolCalls.push({
        name: toolName,
        params,
        originalXml
      });
    }
  }
  
  return toolCalls;
};

/**
 * Checks if a message content contains XML tool calls
 * @param {string} content - The message content to check
 * @returns {boolean} - True if the content contains XML tool calls
 */
export const containsXmlToolCalls = (content) => {
  if (!content || typeof content !== 'string') {
    return false;
  }
  
  // Check for tool call pattern: <tool_name>...</tool_name>
  const toolRegex = /<([a-zA-Z_]+)>\s*[\s\S]*?\s*<\/\1>/;
  return toolRegex.test(content);
}; 