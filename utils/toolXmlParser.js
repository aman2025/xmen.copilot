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
    xmlContent += '\n\n';
  }

  // Process each tool call and convert to XML format
  message.toolCalls.forEach((toolCall) => {
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
      xmlContent += `  <${paramName}>${paramValue}</${paramName}>\n`;
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
  
  // Check for Mistral format with <|tool_use|> tags
  if (content.includes('<|tool_use|>')) {
    return parseMistralToolFormat(content);
  }
  
  // Check for Mistral format with [message={}] pattern
  if (content.includes('[message=')) {
    return parseMistralMessageFormat(content);
  }
  
  // Standard XML format parsing
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
 * Parse Mistral-specific tool format with <|tool_use|> tags
 * @param {string} content - The message content with Mistral tool format
 * @returns {Array} - Array of parsed tool calls
 */
const parseMistralToolFormat = (content) => {
  const toolCalls = [];
  
  // Extract the tool section
  const toolUseMatch = content.match(/<\|tool_use\|>([\s\S]*?)<\/tool_use\|>/);
  if (!toolUseMatch) return [];
  
  const toolSection = toolUseMatch[1];
  
  // Extract tool name
  const nameMatch = /<name>([\s\S]*?)<\/name>/.exec(toolSection);
  if (!nameMatch) return [];
  
  const toolName = nameMatch[1].trim();
  
  // Extract arguments
  const params = {};
  const argumentsSection = toolSection.match(/<arguments>([\s\S]*?)<\/arguments>/);
  
  if (argumentsSection) {
    // Match each argument
    const argumentRegex = /<argument>([\s\S]*?)<\/argument>/g;
    let argMatch;
    
    while ((argMatch = argumentRegex.exec(argumentsSection[1])) !== null) {
      const argContent = argMatch[1];
      
      // Extract name and value
      const nameMatch = /<name>([\s\S]*?)<\/name>/.exec(argContent);
      const valueMatch = /<value>([\s\S]*?)<\/value>/.exec(argContent);
      
      if (nameMatch && valueMatch) {
        params[nameMatch[1].trim()] = valueMatch[1].trim();
      }
    }
  }
  
  if (toolName) {
    toolCalls.push({
      name: toolName,
      params,
      originalXml: toolUseMatch[0]
    });
  }
  
  return toolCalls;
};

/**
 * Parse Mistral message format [message={"name": "tool_name", "arguments": {...}}]
 * @param {string} content - The message content with Mistral message format
 * @returns {Array} - Array of parsed tool calls
 */
const parseMistralMessageFormat = (content) => {
  const toolCalls = [];
  
  try {
    // Extract the JSON part from [message=...]
    const messageMatch = content.match(/\[message=(.*?)\]/)
    if (!messageMatch || !messageMatch[1]) return [];
    
    // Parse the JSON
    const messageJson = JSON.parse(messageMatch[1]);
    
    if (messageJson.name && messageJson.arguments) {
      const toolName = messageJson.name;
      const params = messageJson.arguments;
      
      toolCalls.push({
        name: toolName,
        params,
        originalXml: messageMatch[0]
      });
    }
  } catch (error) {
    console.error('Error parsing Mistral message format:', error);
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
  
  // Check for Mistral message format
  if (content.includes('[message=')) {
    return true;
  }
  
  // Check for Mistral format
  if (content.includes('<|tool_use|>') && content.includes('<name>')) {
    return true;
  }
  
  // Check for standard XML tool call pattern
  const toolRegex = /<([a-zA-Z_]+)>\s*[\s\S]*?\s*<\/\1>/;
  return toolRegex.test(content) && content.includes('_');
}; 