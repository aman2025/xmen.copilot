# Tool Management System

A comprehensive utility system for managing and executing tool modules in the AI Productivity Assistant project.

## Overview

This tool management system provides a centralized way to:
- Register and organize tool modules
- Execute tools with parameter validation
- Handle errors consistently
- Batch execute multiple tools
- Introspect available tools and their metadata

## Architecture

```
tool-calls/
├── index.js          # Main entry point with simplified API
├── toolManager.js    # Core tool execution logic
├── toolConfig.js     # Tool registry and metadata
├── example.js        # Usage examples and demos
├── README.md         # This documentation
└── tools/            # Individual tool modules
    ├── get_instances.js
    ├── get_services.js
    └── start_instance.js
```

## Quick Start

### Basic Usage

```javascript
import callTool from './tool-calls/index.js'

// Execute a tool
const result = await callTool('get_services')
console.log(result.data) // Tool execution result

// Execute with parameters
const instances = await callTool('get_instances', { serviceId: '1001' })
console.log(instances.data)
```

### Advanced Usage

```javascript
import { 
  callToolWithOptions,
  callToolBatch,
  validateTool,
  getTools,
  ToolError
} from './tool-calls/index.js'

// Execute with custom options
const result = await callToolWithOptions(
  'get_services',
  { serviceName: 'dfa' },
  { validateParams: true, logExecution: false }
)

// Batch execution
const toolCalls = [
  { toolName: 'get_services', params: {} },
  { toolName: 'get_instances', params: { serviceId: '1001' } }
]
const results = await callToolBatch(toolCalls)

// Parameter validation
const validation = validateTool('start_instance', { instanceId: '112' })
if (!validation.isValid) {
  console.log('Validation errors:', validation.errors)
}
```

## API Reference

### Main Functions

#### `callTool(toolName, params)`
Execute a tool with the given parameters.
- **toolName** (string): Name of the tool to execute
- **params** (object): Parameters to pass to the tool
- **Returns**: Promise resolving to execution result

#### `callToolWithOptions(toolName, params, options)`
Execute a tool with custom options.
- **options.validateParams** (boolean): Enable parameter validation (default: true)
- **options.logExecution** (boolean): Enable execution logging (default: true)

#### `callToolBatch(toolCalls, options)`
Execute multiple tools in sequence.
- **toolCalls** (array): Array of `{toolName, params}` objects
- **options.stopOnError** (boolean): Stop execution on first error

#### `validateTool(toolName, params)`
Validate tool parameters without executing.
- **Returns**: `{isValid: boolean, errors: string[]}`

### Utility Functions

#### `getTools()`
Get information about all available tools.

#### `listTools()`
Get array of available tool names.

#### `hasToolAvailable(toolName)`
Check if a tool is available.

#### `getToolInfo(toolName)`
Get metadata for a specific tool.

## Tool Development

### Adding New Tools

1. Create a new tool module in `tools/` directory:

```javascript
// tools/my_new_tool.js
const my_new_tool = async (params = {}) => {
  const { requiredParam, optionalParam } = params
  
  // Validate required parameters
  if (!requiredParam) {
    throw new Error('requiredParam is required')
  }
  
  // Your tool logic here
  // This would typically call an API
  const result = await callBusinessAPI(requiredParam, optionalParam)
  
  return result
}

export default my_new_tool
```

2. Register the tool in `toolConfig.js`:

```javascript
// Add import
import my_new_tool from './tools/my_new_tool.js'

// Add to TOOL_REGISTRY
export const TOOL_REGISTRY = {
  // ... existing tools
  my_new_tool
}

// Add to TOOL_METADATA
export const TOOL_METADATA = {
  // ... existing metadata
  my_new_tool: {
    name: 'my_new_tool',
    description: 'Description of what this tool does',
    parameters: {
      requiredParam: {
        type: 'string',
        required: true,
        description: 'Description of required parameter'
      },
      optionalParam: {
        type: 'string',
        required: false,
        description: 'Description of optional parameter'
      }
    }
  }
}
```

### Tool Module Guidelines

- Each tool should be an async function
- Accept a `params` object as the first argument
- Validate required parameters and throw descriptive errors
- Return data directly (the tool manager will wrap it)
- Use consistent error handling
- Add appropriate logging for debugging

## Error Handling

The system uses a custom `ToolError` class for consistent error handling:

```javascript
try {
  const result = await callTool('nonexistent_tool')
} catch (error) {
  if (error instanceof ToolError) {
    console.log('Tool error:', error.message)
    console.log('Tool name:', error.toolName)
    console.log('Original error:', error.originalError)
  }
}
```

## Response Format

All tool executions return a standardized response:

```javascript
{
  success: true,
  toolName: 'get_services',
  executionTime: 45, // milliseconds
  data: [...], // Actual tool result
  timestamp: '2024-01-15T10:30:00.000Z'
}
```

## Examples

See `example.js` for comprehensive usage examples including:
- Basic tool execution
- Parameter validation
- Batch execution
- Error handling
- Tool introspection
- Real-world workflow simulation

Run examples:
```bash
node tool-calls/example.js
```

## Available Tools

### get_services
Retrieve services, optionally filtered by service name.
- **Parameters**: `serviceName` (optional string)

### get_instances
Retrieve instances, optionally filtered by service ID.
- **Parameters**: `serviceId` (optional string)

### start_instance
Start a specific instance.
- **Parameters**: `instanceId` (required string)

## Future Enhancements

- Tool versioning support
- Async tool execution with callbacks
- Tool execution caching
- Performance metrics and monitoring
- Tool dependency management
- Dynamic tool loading
