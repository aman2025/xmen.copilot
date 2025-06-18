// Test script to verify the duplicate API request message fix
// This simulates the tool execution flow to ensure no duplicate messages are created

import Task from './index.js'

// Mock the store and other dependencies for testing
const mockStore = {
  clineMessages: [],
  addClineMessage: (message) => {
    mockStore.clineMessages.push(message)
    console.log(`📝 Added message: ${message.type}/${message.say} - ${message.text?.substring(0, 50)}...`)
  },
  setClineMessages: (messages) => {
    mockStore.clineMessages = messages
  }
}

// Mock useChatStore
global.useChatStore = {
  getState: () => mockStore
}

// Mock fetch for API calls
global.fetch = async (url, options) => {
  console.log(`🌐 API Call: ${url}`)
  // Simulate successful AI response
  return {
    ok: true,
    json: async () => ({
      role: 'assistant',
      content: 'Tool execution completed successfully.'
    })
  }
}

/**
 * Test Case 1: Tool validation failure
 * Should create only ONE API request message
 */
async function testValidationFailure() {
  console.log('\n🧪 Test Case 1: Tool Validation Failure')
  console.log('=====================================')
  
  const task = new Task('test-validation-failure')
  const initialMessageCount = mockStore.clineMessages.length
  
  try {
    // This should fail validation (missing required parameter)
    await task.executeTool('start_instance', {}, 'test_call_001')
  } catch (error) {
    console.log('Expected error caught:', error.message)
  }
  
  const finalMessageCount = mockStore.clineMessages.length
  const apiRequestMessages = mockStore.clineMessages.filter(m => m.say === 'api_req_started')
  
  console.log(`📊 Messages added: ${finalMessageCount - initialMessageCount}`)
  console.log(`📊 API request messages: ${apiRequestMessages.length}`)
  
  if (apiRequestMessages.length === 1) {
    console.log('✅ SUCCESS: Only one API request message created')
  } else {
    console.log('❌ FAILURE: Multiple API request messages created')
    apiRequestMessages.forEach((msg, index) => {
      console.log(`   ${index + 1}. ${msg.text}`)
    })
  }
}

/**
 * Test Case 2: Tool not found
 * Should create only ONE API request message
 */
async function testToolNotFound() {
  console.log('\n🧪 Test Case 2: Tool Not Found')
  console.log('===============================')
  
  const task = new Task('test-tool-not-found')
  const initialMessageCount = mockStore.clineMessages.length
  
  try {
    // This should fail because tool doesn't exist
    await task.executeTool('nonexistent_tool', {}, 'test_call_002')
  } catch (error) {
    console.log('Expected error caught:', error.message)
  }
  
  const finalMessageCount = mockStore.clineMessages.length
  const apiRequestMessages = mockStore.clineMessages.filter(m => m.say === 'api_req_started')
  const newApiRequestMessages = apiRequestMessages.slice(-(finalMessageCount - initialMessageCount))
  
  console.log(`📊 Messages added: ${finalMessageCount - initialMessageCount}`)
  console.log(`📊 New API request messages: ${newApiRequestMessages.length}`)
  
  if (newApiRequestMessages.length === 1) {
    console.log('✅ SUCCESS: Only one API request message created')
  } else {
    console.log('❌ FAILURE: Multiple API request messages created')
    newApiRequestMessages.forEach((msg, index) => {
      console.log(`   ${index + 1}. ${msg.text}`)
    })
  }
}

/**
 * Test Case 3: Successful tool execution
 * Should create only ONE API request message
 */
async function testSuccessfulExecution() {
  console.log('\n🧪 Test Case 3: Successful Tool Execution')
  console.log('=========================================')
  
  const task = new Task('test-successful-execution')
  const initialMessageCount = mockStore.clineMessages.length
  
  try {
    // This should succeed
    await task.executeTool('get_services', { serviceName: 'dfa' }, 'test_call_003')
  } catch (error) {
    console.log('Unexpected error:', error.message)
  }
  
  const finalMessageCount = mockStore.clineMessages.length
  const apiRequestMessages = mockStore.clineMessages.filter(m => m.say === 'api_req_started')
  const newApiRequestMessages = apiRequestMessages.slice(-(finalMessageCount - initialMessageCount))
  
  console.log(`📊 Messages added: ${finalMessageCount - initialMessageCount}`)
  console.log(`📊 New API request messages: ${newApiRequestMessages.length}`)
  
  if (newApiRequestMessages.length === 1) {
    console.log('✅ SUCCESS: Only one API request message created')
  } else {
    console.log('❌ FAILURE: Multiple API request messages created')
    newApiRequestMessages.forEach((msg, index) => {
      console.log(`   ${index + 1}. ${msg.text}`)
    })
  }
}

/**
 * Test Case 4: Check message status progression
 * Should show loading → completed (not loading → error → completed)
 */
async function testMessageStatusProgression() {
  console.log('\n🧪 Test Case 4: Message Status Progression')
  console.log('==========================================')
  
  const task = new Task('test-status-progression')
  
  // Clear messages for clean test
  mockStore.clineMessages = []
  
  try {
    await task.executeTool('get_instances', { serviceId: '1001' }, 'test_call_004')
  } catch (error) {
    console.log('Error:', error.message)
  }
  
  const apiRequestMessages = mockStore.clineMessages.filter(m => m.say === 'api_req_started')
  
  console.log('📊 API Request Message Progression:')
  apiRequestMessages.forEach((msg, index) => {
    try {
      const parsed = JSON.parse(msg.text)
      const status = parsed.status || 'loading'
      console.log(`   ${index + 1}. Status: ${status} - ${parsed.request}`)
    } catch (e) {
      console.log(`   ${index + 1}. Raw: ${msg.text.substring(0, 100)}...`)
    }
  })
  
  if (apiRequestMessages.length === 1) {
    console.log('✅ SUCCESS: Single message with proper status progression')
  } else {
    console.log('❌ FAILURE: Multiple messages indicate status progression issue')
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Testing Duplicate API Request Message Fix')
  console.log('=============================================')
  
  await testValidationFailure()
  await testToolNotFound()
  await testSuccessfulExecution()
  await testMessageStatusProgression()
  
  console.log('\n📋 Test Summary')
  console.log('===============')
  console.log('All tests completed. Check the results above.')
  console.log('✅ = Fix working correctly (only one API request message per tool execution)')
  console.log('❌ = Issue still exists (multiple API request messages created)')
  
  console.log('\n📝 Total messages in store:', mockStore.clineMessages.length)
  console.log('📝 Total API request messages:', mockStore.clineMessages.filter(m => m.say === 'api_req_started').length)
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error)
}

export { runAllTests, testValidationFailure, testToolNotFound, testSuccessfulExecution, testMessageStatusProgression }
