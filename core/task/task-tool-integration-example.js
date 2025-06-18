// Example demonstrating how to use the integrated tool system in Task class
// This file shows various ways to interact with tools through the Task class

import Task from './index.js'

/**
 * Example 1: Basic tool usage in Task context
 */
async function basicTaskToolUsage() {
  console.log('\n=== Basic Task Tool Usage ===')
  
  // Create a task instance (normally done by the controller)
  const task = new Task('example-chat-id')
  
  // Check available tools
  const availableTools = task.listAvailableTools()
  console.log('Available tools:', availableTools)
  
  // Check if specific tools are available
  console.log('Has get_services?', task.isToolAvailable('get_services'))
  console.log('Has get_instances?', task.isToolAvailable('get_instances'))
  console.log('Has nonexistent_tool?', task.isToolAvailable('nonexistent_tool'))
  
  // Get detailed tool information
  const toolsInfo = task.getAvailableTools()
  console.log('Tools info:', {
    count: toolsInfo.toolCount,
    tools: toolsInfo.availableTools
  })
}

/**
 * Example 2: Tool parameter validation in Task context
 */
async function taskToolValidation() {
  console.log('\n=== Task Tool Validation ===')
  
  const task = new Task('validation-chat-id')
  
  // Validate parameters before execution
  const validation1 = task.validateToolParams('start_instance', { instanceId: '112' })
  console.log('Valid start_instance params:', validation1)
  
  const validation2 = task.validateToolParams('start_instance', {}) // Missing required parameter
  console.log('Invalid start_instance params:', validation2)
  
  const validation3 = task.validateToolParams('get_services', { serviceName: 'dfa' })
  console.log('Valid get_services params:', validation3)
  
  const validation4 = task.validateToolParams('nonexistent_tool', {})
  console.log('Nonexistent tool validation:', validation4)
}

/**
 * Example 3: Simulating the actual tool execution flow
 * This demonstrates how the executeTool method now works with the new system
 */
async function simulateToolExecution() {
  console.log('\n=== Simulated Tool Execution Flow ===')
  
  const task = new Task('execution-chat-id')
  
  // Simulate the flow that happens when AI requests a tool call
  const toolCalls = [
    {
      name: 'get_services',
      params: {},
      toolCallId: 'test_call_001'
    },
    {
      name: 'get_instances', 
      params: { serviceId: '1001' },
      toolCallId: 'test_call_002'
    },
    {
      name: 'start_instance',
      params: { instanceId: '112' },
      toolCallId: 'test_call_003'
    }
  ]
  
  // Execute each tool call (this is what happens in the actual Task.executeTool method)
  for (const toolCall of toolCalls) {
    try {
      console.log(`\nExecuting tool: ${toolCall.name}`)
      console.log(`Parameters:`, toolCall.params)
      console.log(`Tool Call ID: ${toolCall.toolCallId}`)
      
      // Check if tool is available
      if (!task.isToolAvailable(toolCall.name)) {
        console.error(`❌ Tool '${toolCall.name}' is not available`)
        continue
      }
      
      // Validate parameters
      const validation = task.validateToolParams(toolCall.name, toolCall.params)
      if (!validation.isValid) {
        console.error(`❌ Parameter validation failed:`, validation.errors)
        continue
      }
      
      console.log(`✅ Tool and parameters are valid`)
      console.log(`🚀 This would now execute: task.executeTool('${toolCall.name}', params, '${toolCall.toolCallId}')`)
      
      // Note: We don't actually call executeTool here because it has side effects
      // (API calls, UI updates, etc.) that we don't want in this example
      
    } catch (error) {
      console.error(`❌ Error with tool ${toolCall.name}:`, error.message)
    }
  }
}

/**
 * Example 4: Error handling scenarios
 */
async function errorHandlingExamples() {
  console.log('\n=== Error Handling Examples ===')
  
  const task = new Task('error-handling-chat-id')
  
  // Test various error scenarios
  const errorScenarios = [
    {
      name: 'Tool not found',
      toolName: 'nonexistent_tool',
      params: {}
    },
    {
      name: 'Missing required parameter',
      toolName: 'start_instance',
      params: {} // Missing instanceId
    },
    {
      name: 'Invalid parameter type',
      toolName: 'get_instances',
      params: { serviceId: 123 } // Should be string, but number might be acceptable
    },
    {
      name: 'Valid tool call',
      toolName: 'get_services',
      params: { serviceName: 'dfa' }
    }
  ]
  
  for (const scenario of errorScenarios) {
    console.log(`\nTesting: ${scenario.name}`)
    console.log(`Tool: ${scenario.toolName}`)
    console.log(`Params:`, scenario.params)
    
    // Check availability
    const isAvailable = task.isToolAvailable(scenario.toolName)
    console.log(`Available: ${isAvailable}`)
    
    if (isAvailable) {
      // Validate parameters
      const validation = task.validateToolParams(scenario.toolName, scenario.params)
      console.log(`Validation:`, validation.isValid ? '✅ Valid' : `❌ ${validation.errors.join(', ')}`)
    }
  }
}

/**
 * Example 5: Integration with actual Task workflow
 */
async function taskWorkflowIntegration() {
  console.log('\n=== Task Workflow Integration ===')
  
  const task = new Task('workflow-chat-id')
  
  // This simulates how the tool system integrates with the actual Task workflow
  console.log('1. Task receives AI message with tool_use')
  const aiMessage = {
    type: 'tool_use',
    name: 'get_services',
    params: { serviceName: 'dfa' },
    toolCallId: 'workflow_call_001'
  }
  
  console.log('2. Task checks if tool is available')
  if (!task.isToolAvailable(aiMessage.name)) {
    console.error('❌ Tool not available, would send error to AI')
    return
  }
  
  console.log('3. Task validates parameters')
  const validation = task.validateToolParams(aiMessage.name, aiMessage.params)
  if (!validation.isValid) {
    console.error('❌ Parameter validation failed, would send error to AI')
    console.error('Errors:', validation.errors)
    return
  }
  
  console.log('4. Task would execute tool (if approved)')
  console.log('✅ All checks passed, ready for execution')
  console.log(`Would call: task.executeTool('${aiMessage.name}', params, '${aiMessage.toolCallId}')`)
  
  console.log('\n5. The executeTool method now:')
  console.log('   - Uses callTool() from the tool utility system')
  console.log('   - Gets structured response with execution time and metadata')
  console.log('   - Handles ToolError exceptions with detailed error information')
  console.log('   - Provides consistent logging and error reporting')
}

/**
 * Example 6: Comparison of old vs new approach
 */
function comparisonExample() {
  console.log('\n=== Old vs New Approach Comparison ===')
  
  console.log('OLD APPROACH (before integration):')
  console.log('```javascript')
  console.log('// Dynamic import with manual error handling')
  console.log('try {')
  console.log('  const toolModule = await import(`../../tool-calls/tools/${toolName}.js`)')
  console.log('  const toolFunction = toolModule.default')
  console.log('  if (typeof toolFunction !== "function") throw new Error("Not a function")')
  console.log('  const result = await toolFunction(params)')
  console.log('} catch (error) {')
  console.log('  // Basic error handling')
  console.log('}')
  console.log('```')
  
  console.log('\nNEW APPROACH (with tool utility system):')
  console.log('```javascript')
  console.log('// Centralized tool management with validation')
  console.log('if (!hasToolAvailable(toolName)) {')
  console.log('  throw new Error(`Tool "${toolName}" is not registered`)')
  console.log('}')
  console.log('')
  console.log('const validation = validateTool(toolName, params)')
  console.log('if (!validation.isValid) {')
  console.log('  throw new Error(`Validation failed: ${validation.errors.join(", ")}`)')
  console.log('}')
  console.log('')
  console.log('const toolResult = await callTool(toolName, params)')
  console.log('const result = toolResult.data // Structured response')
  console.log('```')
  
  console.log('\nBENEFITS OF NEW APPROACH:')
  console.log('✅ Centralized tool registry')
  console.log('✅ Parameter validation before execution')
  console.log('✅ Structured error handling with ToolError class')
  console.log('✅ Execution metadata (timing, success status)')
  console.log('✅ Consistent logging across all tools')
  console.log('✅ Easy to add new tools (just register in toolConfig.js)')
  console.log('✅ Tool introspection capabilities')
  console.log('✅ Future-ready for batch execution and caching')
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('🔧 Task Tool Integration Examples')
  console.log('=================================')
  
  await basicTaskToolUsage()
  await taskToolValidation()
  await simulateToolExecution()
  await errorHandlingExamples()
  await taskWorkflowIntegration()
  comparisonExample()
  
  console.log('\n✅ All examples completed!')
  console.log('\n📝 Next Steps:')
  console.log('1. The Task.executeTool method now uses the new tool utility system')
  console.log('2. All existing functionality is preserved with enhanced error handling')
  console.log('3. New utility methods are available for tool introspection')
  console.log('4. Future tools can be easily added by registering in toolConfig.js')
}

// Export functions for individual testing
export {
  basicTaskToolUsage,
  taskToolValidation,
  simulateToolExecution,
  errorHandlingExamples,
  taskWorkflowIntegration,
  comparisonExample,
  runAllExamples
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch(console.error)
}
