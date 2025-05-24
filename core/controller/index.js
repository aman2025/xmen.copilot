import Task from '../task'

class Controller {
  constructor() {
    // Current active task instance
    this.task = null
  }

  async initTask(userInput) {
    console.log('Controller: initTask called with userInput:', userInput)

    // Create a new task instance
    // The Task constructor will call startTask, which will handle adding initial messages to the store.
    this.task = new Task(userInput)
    console.log('Controller: Created new Task instance')

    // No need to return messages here, as Task manages clineMessages directly with the store
    // and adds them.
    return {}
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

    // Create user response message that will be shown in the UI.
    const userActionDisplayMessage = {
      ts: Date.now(),
      type: 'say',
      say: 'text',
      text:
        response === 'approve' ? 'Approved tool execution.' : 'Rejected tool execution.'
    }

    // Process the approval/rejection. The Task will handle its own internal state
    // and update the clineMessages in the store with subsequent messages (tool results, new AI responses etc.)
    console.log('Controller: Processing approval/rejection:', response)
    await this.task.handleApprovalResponse(response === 'approve' ? 'approved' : 'rejected')
    console.log('Controller: Finished processing approval/rejection')

    // Return only the message that explicitly shows the user's action.
    // Other messages (like api_req_started, or new assistant messages) will be added by the Task itself.
    return {
      userMessage: userActionDisplayMessage
    }
  }
}

export default Controller
