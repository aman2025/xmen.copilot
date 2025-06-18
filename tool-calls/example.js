// Example usage of the tool management system
// This file demonstrates how to use the tool utility functions

import callTool, { 
  callToolWithOptions,
  callToolBatch,
  validateTool,
  getTools,
  hasToolAvailable,
  getToolInfo,
  listTools,
  ToolError
} from './index.js'

/**
 * Example 1: Basic tool execution
 */
async function basicToolUsage() {
  console.log('\n=== Basic Tool Usage ===')
  
  try {
    // Get all services
    const services = await callTool('get_services')
    console.log('All services:', services.data)
    
    // Get services filtered by name
    const filteredServices = await callTool('get_services', { serviceName: 'dfa' })
    console.log('Filtered services:', filteredServices.data)
    
    // Get all instances
    const instances = await callTool('get_instances')
    console.log('All instances:', instances.data)
    
    // Get instances for a specific service
    const serviceInstances = await callTool('get_instances', { serviceId: '1001' })
    console.log('Service instances:', serviceInstances.data)
    
    // Start an instance
    const startResult = await callTool('start_instance', { instanceId: '112' })
    console.log('Start instance result:', startResult.data)
    
  } catch (error) {
    console.error('Error in basic usage:', error.message)
  }
}

/**
 * Example 2: Tool validation
 */
async function toolValidationExample() {
  console.log('\n=== Tool Validation Example ===')
  
  // Validate parameters before execution
  const validation1 = validateTool('start_instance', { instanceId: '112' })
  console.log('Valid parameters:', validation1)
  
  const validation2 = validateTool('start_instance', {}) // Missing required parameter
  console.log('Invalid parameters:', validation2)
  
  const validation3 = validateTool('nonexistent_tool', {})
  console.log('Nonexistent tool:', validation3)
}

/**
 * Example 3: Batch tool execution
 */
async function batchToolExample() {
  console.log('\n=== Batch Tool Execution ===')
  
  const toolCalls = [
    { toolName: 'get_services', params: {} },
    { toolName: 'get_instances', params: { serviceId: '1001' } },
    { toolName: 'start_instance', params: { instanceId: '112' } }
  ]
  
  try {
    const results = await callToolBatch(toolCalls)
    console.log('Batch execution results:')
    results.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.toolName}:`, result.success ? 'SUCCESS' : 'FAILED')
      if (result.success) {
        console.log('     Data:', result.data)
      } else {
        console.log('     Error:', result.error)
      }
    })
  } catch (error) {
    console.error('Batch execution error:', error.message)
  }
}

/**
 * Example 4: Advanced options and error handling
 */
async function advancedUsageExample() {
  console.log('\n=== Advanced Usage Example ===')
  
  try {
    // Execute with custom options
    const result = await callToolWithOptions(
      'get_services',
      { serviceName: 'dfa' },
      { 
        validateParams: true,
        logExecution: true
      }
    )
    console.log('Advanced execution result:', result)
    
    // Handle tool errors
    try {
      await callTool('nonexistent_tool', {})
    } catch (error) {
      if (error instanceof ToolError) {
        console.log('Caught ToolError:', {
          message: error.message,
          toolName: error.toolName,
          originalError: error.originalError?.message
        })
      }
    }
    
  } catch (error) {
    console.error('Advanced usage error:', error.message)
  }
}

/**
 * Example 5: Tool introspection
 */
function toolIntrospectionExample() {
  console.log('\n=== Tool Introspection Example ===')
  
  // List all available tools
  const availableTools = listTools()
  console.log('Available tools:', availableTools)
  
  // Check if specific tools are available
  console.log('Has get_services?', hasToolAvailable('get_services'))
  console.log('Has nonexistent_tool?', hasToolAvailable('nonexistent_tool'))
  
  // Get tool metadata
  const toolInfo = getToolInfo('start_instance')
  console.log('start_instance metadata:', toolInfo)
  
  // Get all tools information
  const allToolsInfo = getTools()
  console.log('All tools info:', {
    count: allToolsInfo.toolCount,
    tools: allToolsInfo.availableTools
  })
}

/**
 * Example 6: Real-world workflow simulation
 */
async function workflowExample() {
  console.log('\n=== Workflow Example ===')
  
  try {
    // Step 1: Get all services
    console.log('Step 1: Getting all services...')
    const servicesResult = await callTool('get_services')
    const services = servicesResult.data
    
    if (services.length === 0) {
      console.log('No services found')
      return
    }
    
    // Step 2: For each service, get its instances
    console.log('Step 2: Getting instances for each service...')
    for (const service of services) {
      const instancesResult = await callTool('get_instances', { 
        serviceId: service.serviceId 
      })
      const instances = instancesResult.data
      
      console.log(`Service ${service.serviceName} has ${instances.length} instances:`)
      instances.forEach(instance => {
        console.log(`  - ${instance.instanceName} (${instance.instanceStatus})`)
      })
      
      // Step 3: Start any stopped instances (simulated)
      const stoppedInstances = instances.filter(i => i.instanceStatus !== 'running')
      if (stoppedInstances.length > 0) {
        console.log(`Starting ${stoppedInstances.length} stopped instances...`)
        for (const instance of stoppedInstances) {
          const startResult = await callTool('start_instance', { 
            instanceId: instance.instanceId 
          })
          console.log(`  Started ${instance.instanceName}:`, startResult.data.message)
        }
      }
    }
    
  } catch (error) {
    console.error('Workflow error:', error.message)
  }
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('🚀 Tool Management System Examples')
  console.log('==================================')
  
  await basicToolUsage()
  await toolValidationExample()
  await batchToolExample()
  await advancedUsageExample()
  toolIntrospectionExample()
  await workflowExample()
  
  console.log('\n✅ All examples completed!')
}

// Export the example functions for individual testing
export {
  basicToolUsage,
  toolValidationExample,
  batchToolExample,
  advancedUsageExample,
  toolIntrospectionExample,
  workflowExample,
  runAllExamples
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch(console.error)
}
