import useGlobalStore from '../../store/useGlobalStore'

/**
 * EnvironmentContextManager - Utility class for managing environment context
 * that gets appended to AI communications
 */
export class EnvironmentContextManager {
  constructor() {
    this.contextCache = new Map()
    this.lastCacheUpdate = 0
    this.cacheTimeout = 5000 // 5 seconds cache timeout
  }

  /**
   * Get comprehensive environment details for AI context
   * @param {Object} additionalContext - Additional context to include
   * @returns {string} Formatted environment details
   */
  getEnvironmentDetails(additionalContext = {}) {
    const cacheKey = JSON.stringify(additionalContext)
    const now = Date.now()
    
    // Check cache first
    if (this.contextCache.has(cacheKey) && (now - this.lastCacheUpdate) < this.cacheTimeout) {
      return this.contextCache.get(cacheKey)
    }

    const globalState = useGlobalStore.getState()
    const { user, system } = globalState

    const environmentDetails = this.formatEnvironmentDetails({
      user,
      system,
      timestamp: new Date().toISOString(),
      ...additionalContext
    })

    // Update cache
    this.contextCache.set(cacheKey, environmentDetails)
    this.lastCacheUpdate = now

    return environmentDetails
  }

  /**
   * Format environment details into a structured string
   * @param {Object} context - Context object containing user, system, and additional info
   * @returns {string} Formatted environment details
   */
  formatEnvironmentDetails(context) {
    const { user, system, timestamp, chatId, taskStatus, waitingForApproval, toolName, ...additional } = context

    let details = `# User Information
    Name: ${user?.name || user?.username || 'Unknown'}
    Email: ${user?.email || 'Unknown'}

# System Information
    Mode: ${system?.mode || 'Unknown'}
    Version: ${system?.version || 'Unknown'}
    Timestamp: ${timestamp}`

    // Add task-specific context if available
    if (chatId || taskStatus !== undefined || waitingForApproval !== undefined) {
      details += `

# Task Context`
      if (chatId) details += `\n    Chat ID: ${chatId}`
      if (taskStatus !== undefined) details += `\n    Task Status: ${taskStatus}`
      if (waitingForApproval !== undefined) details += `\n    Waiting for Approval: ${waitingForApproval ? 'Yes' : 'No'}`
      if (toolName) details += `\n    Last Tool: ${toolName}`
    }

    // Add any additional context
    if (Object.keys(additional).length > 0) {
      details += `

# Additional Context`
      for (const [key, value] of Object.entries(additional)) {
        if (value !== undefined && value !== null) {
          details += `\n    ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`
        }
      }
    }

    return details
  }

  /**
   * Enhance tool result content with environment context
   * @param {any} result - The tool execution result
   * @param {string} toolName - Name of the executed tool
   * @param {Object} additionalContext - Additional context to include
   * @returns {string} Enhanced content with result and environment details
   */
  enhanceToolResult(result, toolName, additionalContext = {}) {
    const resultContent = typeof result === 'string' ? result : JSON.stringify(result)
    const environmentDetails = this.getEnvironmentDetails({
      toolName,
      ...additionalContext
    })
    
    return `<result>${resultContent}</result>

<environment_details>
${environmentDetails}
</environment_details>`
  }

  /**
   * Enhance user input with environment context
   * @param {string} userInput - The user's input text
   * @param {Object} additionalContext - Additional context to include
   * @returns {string} Enhanced user input with task and environment details
   */
  enhanceUserInput(userInput, additionalContext = {}) {
    const environmentDetails = this.getEnvironmentDetails(additionalContext)
    
    return `<task>
    ${userInput}
  </task>

  <environment_details>
${environmentDetails}
  </environment_details>`
  }

  /**
   * Clear the context cache
   */
  clearCache() {
    this.contextCache.clear()
    this.lastCacheUpdate = 0
  }

  /**
   * Get current cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      cacheSize: this.contextCache.size,
      lastUpdate: this.lastCacheUpdate,
      cacheAge: Date.now() - this.lastCacheUpdate
    }
  }
}

export default EnvironmentContextManager
