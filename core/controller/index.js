import Task from '../task'

class Controller {
  constructor() {
    // Current active task instance
    this.task = null
  }

  async initTask(userInput) {
    console.log('Controller: initTask called with userInput:', userInput)

    // Create a new task instance
    this.task = new Task(userInput)
    console.log('Controller: Created new Task instance')

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
    if (!this.task) {
      console.warn('No active task')
      return null
    }

    if (!this.task.waitingForApproval) {
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
    console.log('Controller: Processing approval/rejection:', response)
    await this.task.handleApprovalResponse(response === 'approve' ? 'approved' : 'rejected')
    console.log('Controller: Finished processing approval/rejection')

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

    console.log('Controller: Returning result from handleUserResponse:', {
      userMessage,
      apiRequestStartedMessage,
      copilotMessage
    })

    return {
      userMessage,
      apiRequestStartedMessage,
      copilotMessage
    }
  }
}

export default Controller
