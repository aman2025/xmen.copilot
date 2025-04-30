import Task from '../task'

class Controller {
  constructor() {
    // Current active task instance
    this.task = null
  }

  async initTask(userInput) {
    this.task = new Task(userInput)
  }

  async handleUserMessage(text) {
    await this.initTask(text)
  }
}

export default Controller
