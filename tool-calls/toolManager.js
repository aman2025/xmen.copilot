// Core tool manager utility
// Handles tool execution, validation, and error handling

import { TOOL_REGISTRY, TOOL_METADATA, isValidTool, getToolMetadata } from './toolConfig.js'

/**
 * Custom error class for tool-related errors
 */
export class ToolError extends Error {
  constructor(message, toolName = null, originalError = null) {
    super(message)
    this.name = 'ToolError'
    this.toolName = toolName
    this.originalError = originalError
  }
}

/**
 * Validate tool parameters against metadata
 * @param {string} toolName - Name of the tool
 * @param {Object} params - Parameters to validate
 * @returns {Object} Validation result with isValid and errors
 */
export const validateToolParameters = (toolName, params = {}) => {
  const metadata = getToolMetadata(toolName)
  if (!metadata) {
    return {
      isValid: false,
      errors: [`Tool "${toolName}" not found`]
    }
  }

  const errors = []
  const { parameters } = metadata

  // Check required parameters
  for (const [paramName, paramConfig] of Object.entries(parameters)) {
    if (paramConfig.required && (params[paramName] === undefined || params[paramName] === null)) {
      errors.push(`Required parameter "${paramName}" is missing`)
    }
  }

  // Check parameter types (basic validation)
  for (const [paramName, paramValue] of Object.entries(params)) {
    if (parameters[paramName] && paramValue !== undefined && paramValue !== null) {
      const expectedType = parameters[paramName].type
      const actualType = typeof paramValue

      if (expectedType === 'string' && actualType !== 'string') {
        errors.push(`Parameter "${paramName}" should be a string, got ${actualType}`)
      } else if (expectedType === 'number' && actualType !== 'number') {
        errors.push(`Parameter "${paramName}" should be a number, got ${actualType}`)
      } else if (expectedType === 'boolean' && actualType !== 'boolean') {
        errors.push(`Parameter "${paramName}" should be a boolean, got ${actualType}`)
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Execute a tool with given parameters
 * @param {string} toolName - Name of the tool to execute
 * @param {Object} params - Parameters to pass to the tool
 * @param {Object} options - Execution options
 * @param {boolean} options.validateParams - Whether to validate parameters (default: true)
 * @param {boolean} options.logExecution - Whether to log execution details (default: true)
 * @returns {Promise<any>} Tool execution result
 * @throws {ToolError} When tool is not found or execution fails
 */
export const executeTool = async (toolName, params = {}, options = {}) => {
  const {
    validateParams = true,
    logExecution = true
  } = options

  try {
    // Log execution start
    if (logExecution) {
      console.log(`[ToolManager] Executing tool: ${toolName}`, { params })
    }

    // Check if tool exists
    if (!isValidTool(toolName)) {
      throw new ToolError(`Tool "${toolName}" is not registered`, toolName)
    }

    // Validate parameters if requested
    if (validateParams) {
      const validation = validateToolParameters(toolName, params)
      if (!validation.isValid) {
        throw new ToolError(
          `Parameter validation failed for tool "${toolName}": ${validation.errors.join(', ')}`,
          toolName
        )
      }
    }

    // Get and execute the tool function
    const toolFunction = TOOL_REGISTRY[toolName]
    const startTime = Date.now()
    
    const result = await toolFunction(params)
    
    const executionTime = Date.now() - startTime

    // Log execution completion
    if (logExecution) {
      console.log(`[ToolManager] Tool "${toolName}" executed successfully in ${executionTime}ms`)
    }

    return {
      success: true,
      toolName,
      executionTime,
      data: result,
      timestamp: new Date().toISOString()
    }

  } catch (error) {
    // Log execution error
    if (logExecution) {
      console.error(`[ToolManager] Tool "${toolName}" execution failed:`, error)
    }

    // Re-throw ToolError as-is, wrap other errors
    if (error instanceof ToolError) {
      throw error
    } else {
      throw new ToolError(
        `Tool "${toolName}" execution failed: ${error.message}`,
        toolName,
        error
      )
    }
  }
}

/**
 * Execute multiple tools in sequence
 * @param {Array<{toolName: string, params: Object}>} toolCalls - Array of tool calls
 * @param {Object} options - Execution options
 * @returns {Promise<Array>} Array of execution results
 */
export const executeToolBatch = async (toolCalls, options = {}) => {
  const results = []
  
  for (const { toolName, params } of toolCalls) {
    try {
      const result = await executeTool(toolName, params, options)
      results.push(result)
    } catch (error) {
      results.push({
        success: false,
        toolName,
        error: error.message,
        timestamp: new Date().toISOString()
      })
      
      // Stop execution on first error if stopOnError is true
      if (options.stopOnError) {
        break
      }
    }
  }
  
  return results
}

/**
 * Get information about all available tools
 * @returns {Object} Object containing tool registry and metadata
 */
export const getToolsInfo = () => {
  return {
    availableTools: Object.keys(TOOL_REGISTRY),
    toolCount: Object.keys(TOOL_REGISTRY).length,
    metadata: TOOL_METADATA
  }
}
