// Tool configuration and registry
// This file maps tool names to their corresponding modules

import get_instances from './tools/get_instances.js'
import get_services from './tools/get_services.js'
import start_instance from './tools/start_instance.js'

/**
 * Tool registry mapping tool names to their corresponding functions
 * @type {Object<string, Function>}
 */
export const TOOL_REGISTRY = {
  get_instances,
  get_services,
  start_instance
}

/**
 * Tool metadata for validation and documentation
 * @type {Object<string, Object>}
 */
export const TOOL_METADATA = {
  get_instances: {
    name: 'get_instances',
    description: 'Retrieve instances, optionally filtered by serviceId',
    parameters: {
      serviceId: {
        type: 'string',
        required: false,
        description: 'Filter instances by service ID'
      }
    }
  },
  get_services: {
    name: 'get_services',
    description: 'Retrieve services, optionally filtered by serviceName',
    parameters: {
      serviceName: {
        type: 'string',
        required: false,
        description: 'Filter services by service name (case-insensitive partial match)'
      }
    }
  },
  start_instance: {
    name: 'start_instance',
    description: 'Start a specific instance by instanceId',
    parameters: {
      instanceId: {
        type: 'string',
        required: true,
        description: 'The ID of the instance to start'
      }
    }
  }
}

/**
 * Get list of available tool names
 * @returns {string[]} Array of available tool names
 */
export const getAvailableTools = () => {
  return Object.keys(TOOL_REGISTRY)
}

/**
 * Check if a tool exists in the registry
 * @param {string} toolName - Name of the tool to check
 * @returns {boolean} True if tool exists, false otherwise
 */
export const isValidTool = (toolName) => {
  return toolName in TOOL_REGISTRY
}

/**
 * Get tool metadata
 * @param {string} toolName - Name of the tool
 * @returns {Object|null} Tool metadata or null if tool doesn't exist
 */
export const getToolMetadata = (toolName) => {
  return TOOL_METADATA[toolName] || null
}
