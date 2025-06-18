// Main entry point for tool management system
// Provides a unified interface for all tool operations

import { 
  executeTool, 
  executeToolBatch, 
  validateToolParameters, 
  getToolsInfo,
  ToolError 
} from './toolManager.js'

import { 
  TOOL_REGISTRY, 
  TOOL_METADATA, 
  getAvailableTools, 
  isValidTool, 
  getToolMetadata 
} from './toolConfig.js'

/**
 * Main tool execution function - simplified interface
 * @param {string} toolName - Name of the tool to execute
 * @param {Object} params - Parameters to pass to the tool
 * @returns {Promise<any>} Tool execution result
 */
export const callTool = async (toolName, params = {}) => {
  return await executeTool(toolName, params)
}

/**
 * Execute tool with custom options
 * @param {string} toolName - Name of the tool to execute
 * @param {Object} params - Parameters to pass to the tool
 * @param {Object} options - Execution options
 * @returns {Promise<any>} Tool execution result
 */
export const callToolWithOptions = async (toolName, params = {}, options = {}) => {
  return await executeTool(toolName, params, options)
}

/**
 * Execute multiple tools in sequence
 * @param {Array<{toolName: string, params: Object}>} toolCalls - Array of tool calls
 * @param {Object} options - Execution options
 * @returns {Promise<Array>} Array of execution results
 */
export const callToolBatch = async (toolCalls, options = {}) => {
  return await executeToolBatch(toolCalls, options)
}

/**
 * Validate tool parameters without executing
 * @param {string} toolName - Name of the tool
 * @param {Object} params - Parameters to validate
 * @returns {Object} Validation result
 */
export const validateTool = (toolName, params = {}) => {
  return validateToolParameters(toolName, params)
}

/**
 * Get information about available tools
 * @returns {Object} Tools information
 */
export const getTools = () => {
  return getToolsInfo()
}

/**
 * Check if a tool is available
 * @param {string} toolName - Name of the tool to check
 * @returns {boolean} True if tool is available
 */
export const hasToolAvailable = (toolName) => {
  return isValidTool(toolName)
}

/**
 * Get metadata for a specific tool
 * @param {string} toolName - Name of the tool
 * @returns {Object|null} Tool metadata or null if not found
 */
export const getToolInfo = (toolName) => {
  return getToolMetadata(toolName)
}

/**
 * Get list of all available tool names
 * @returns {string[]} Array of tool names
 */
export const listTools = () => {
  return getAvailableTools()
}

// Export all the underlying utilities for advanced usage
export {
  executeTool,
  executeToolBatch,
  validateToolParameters,
  getToolsInfo,
  ToolError,
  TOOL_REGISTRY,
  TOOL_METADATA,
  getAvailableTools,
  isValidTool,
  getToolMetadata
}

// Default export - main tool caller function
export default callTool
