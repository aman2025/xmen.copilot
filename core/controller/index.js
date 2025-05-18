import Task from '../task'

class Controller {
  constructor() {
    // Current active task instance
    this.task = null
  }

  async initTask(userInput) {
    this.task = new Task(userInput)

    // Return messages for UI
    const userMessage = {
      ts: Date.now(),
      type: 'say',
      say: 'text',
      text: userInput
    }

    // Find the API request started message
    const apiRequestStartedIndex = this.task.findLastIndex(
      this.task.clineMessages,
      (m) => m.say === 'api_req_started'
    )

    const apiRequestStartedMessage =
      apiRequestStartedIndex >= 0 ? this.task.clineMessages[apiRequestStartedIndex] : null

    // Find the last message (which should be the assistant's response)
    const lastMessageIndex = this.task.clineMessages.length - 1
    const copilotMessage = lastMessageIndex >= 0 ? this.task.clineMessages[lastMessageIndex] : null

    return {
      userMessage,
      apiRequestStartedMessage,
      copilotMessage
    }
  }

  async handleUserMessage(text) {
    return await this.initTask(text)
  }

  async handleUserResponse(response) {
    if (!this.task || !this.task.waitingForApproval) {
      console.warn('No task waiting for approval')
      return null
    }

    // Create user response message
    const userMessage = {
      ts: Date.now(),
      type: 'say',
      say: 'text',
      text:
        response === 'approve' ? 'I approve this tool execution.' : 'I reject this tool execution.'
    }

    // Process the approval/rejection
    await this.task.handleApprovalResponse(response === 'approve' ? 'approved' : 'rejected')

    // Find the API request started message (if any)
    const apiRequestStartedIndex = this.task.findLastIndex(
      this.task.clineMessages,
      (m) => m.say === 'api_req_started'
    )

    const apiRequestStartedMessage =
      apiRequestStartedIndex >= 0 ? this.task.clineMessages[apiRequestStartedIndex] : null

    // Find the last message (which should be the assistant's response)
    const lastMessageIndex = this.task.clineMessages.length - 1
    const copilotMessage = lastMessageIndex >= 0 ? this.task.clineMessages[lastMessageIndex] : null

    return {
      userMessage,
      apiRequestStartedMessage,
      copilotMessage
    }
  }
}

export default Controller
