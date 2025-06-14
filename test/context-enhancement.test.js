/**
 * Test file to verify the enhanced context functionality
 * This test demonstrates how tool call responses now include environment details
 */

import EnvironmentContextManager from '../core/context/EnvironmentContextManager.js'

// Mock useGlobalStore for testing
const mockGlobalStore = {
  getState: () => ({
    user: {
      username: 'ZR',
      email: '42589963@qq.com'
    },
    system: {
      mode: 'ESIM',
      version: '1.0.40'
    }
  })
}

// Mock the useGlobalStore import
jest.mock('../store/useGlobalStore', () => mockGlobalStore)

describe('Context Enhancement Tests', () => {
  let contextManager

  beforeEach(() => {
    contextManager = new EnvironmentContextManager()
  })

  afterEach(() => {
    contextManager.clearCache()
  })

  test('should enhance tool result with environment context', () => {
    const toolResult = [
      {
        id: "1001",
        serviceId: "1001", 
        serviceName: "dfa-crc",
        description: "Handles all order processing workflows."
      }
    ]

    const enhanced = contextManager.enhanceToolResult(
      toolResult,
      'get_instances',
      {
        chatId: 'test-chat-123',
        taskStatus: 'Active',
        waitingForApproval: false
      }
    )

    // Verify the enhanced content structure
    expect(enhanced).toContain('<result>')
    expect(enhanced).toContain('</result>')
    expect(enhanced).toContain('<environment_details>')
    expect(enhanced).toContain('</environment_details>')
    
    // Verify user information is included
    expect(enhanced).toContain('Name: ZR')
    expect(enhanced).toContain('Email: 42589963@qq.com')
    
    // Verify system information is included
    expect(enhanced).toContain('Mode: ESIM')
    expect(enhanced).toContain('Version: 1.0.40')
    
    // Verify task context is included
    expect(enhanced).toContain('Chat ID: test-chat-123')
    expect(enhanced).toContain('Task Status: Active')
    expect(enhanced).toContain('Last Tool: get_instances')
    
    console.log('Enhanced tool result:', enhanced)
  })

  test('should enhance user input with environment context', () => {
    const userInput = 'Show me all instances with dfa-crc?'
    
    const enhanced = contextManager.enhanceUserInput(
      userInput,
      {
        chatId: 'test-chat-123',
        taskStatus: 'Active'
      }
    )

    // Verify the enhanced content structure
    expect(enhanced).toContain('<task>')
    expect(enhanced).toContain('</task>')
    expect(enhanced).toContain('<environment_details>')
    expect(enhanced).toContain('</environment_details>')
    
    // Verify original user input is preserved
    expect(enhanced).toContain(userInput)
    
    // Verify environment details are included
    expect(enhanced).toContain('Name: ZR')
    expect(enhanced).toContain('Chat ID: test-chat-123')
    
    console.log('Enhanced user input:', enhanced)
  })

  test('should cache environment details for performance', () => {
    const context1 = { chatId: 'test-1' }
    const context2 = { chatId: 'test-1' } // Same context
    const context3 = { chatId: 'test-2' } // Different context

    const result1 = contextManager.getEnvironmentDetails(context1)
    const result2 = contextManager.getEnvironmentDetails(context2)
    const result3 = contextManager.getEnvironmentDetails(context3)

    // Same context should return cached result
    expect(result1).toBe(result2)
    
    // Different context should return different result
    expect(result1).not.toBe(result3)
    
    // Verify cache stats
    const stats = contextManager.getCacheStats()
    expect(stats.cacheSize).toBeGreaterThan(0)
  })

  test('should format environment details correctly', () => {
    const details = contextManager.formatEnvironmentDetails({
      user: { username: 'TestUser', email: 'test@example.com' },
      system: { mode: 'TEST', version: '1.0.0' },
      timestamp: '2023-01-01T00:00:00.000Z',
      chatId: 'test-123',
      taskStatus: 'Active',
      waitingForApproval: true,
      toolName: 'test_tool',
      customField: 'customValue'
    })

    expect(details).toContain('# User Information')
    expect(details).toContain('Name: TestUser')
    expect(details).toContain('Email: test@example.com')
    
    expect(details).toContain('# System Information')
    expect(details).toContain('Mode: TEST')
    expect(details).toContain('Version: 1.0.0')
    
    expect(details).toContain('# Task Context')
    expect(details).toContain('Chat ID: test-123')
    expect(details).toContain('Task Status: Active')
    expect(details).toContain('Waiting for Approval: Yes')
    expect(details).toContain('Last Tool: test_tool')
    
    expect(details).toContain('# Additional Context')
    expect(details).toContain('customField: customValue')
  })
})

// Example of expected enhanced tool call response format
const expectedEnhancedResponse = {
  role: 'tool',
  content: `<result>[{"id":"1001","serviceId":"1001","serviceName":"dfa-crc","description":"Handles all order processing workflows."}]</result>

<environment_details>
# User Information
    Name: ZR
    Email: 42589963@qq.com

# System Information
    Mode: ESIM
    Version: 1.0.40
    Timestamp: 2023-12-14T10:30:00.000Z

# Task Context
    Chat ID: test-chat-123
    Task Status: Active
    Waiting for Approval: No
    Last Tool: get_instances
</environment_details>`,
  tool_call_id: "EwDSCytDt"
}

console.log('Expected enhanced response format:', JSON.stringify(expectedEnhancedResponse, null, 2))
