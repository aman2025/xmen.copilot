import ContextManager from '../context/context-management/ContextManager'
import useChatStore from '../../store/useChatStore'
import { parseAssistantMessage } from '../assistant-message/parse-assistant-message'

class Task {
  constructor(task = null) {
    this.isInitialized = false
    this.apiConversationHistory = []
    this.clineMessages = []
    this.assistantMessageContent = []
    this.taskId = Date.now().toString()
    this.contextManager = new ContextManager()

    // Start task if initial task is provided
    if (task) {
      this.startTask(task)
    }
  }

  getApiConversationHistory() {
    return useChatStore.getState().apiConversationHistory
  }

  async startTask(task) {
    console.log('Task: startTask')
    this.clineMessages = []
    this.apiConversationHistory = []

    await this.say('text', task)

    this.isInitialized = true

    await this.initiateTaskLoop([
      {
        type: 'text',
        text: `<task>\n${task}\n</task>`
      }
    ])
  }

  async initiateTaskLoop(userContent) {
    let nextUserContent = userContent
    await this.recursivelyMakeClineRequests(nextUserContent)
  }
  async recursivelyMakeClineRequests(userContent) {
    // previousApiReqIndex 具体使用多少个历史记录
    // get previous api req's index to check token usage and determine if we need to truncate conversation history
    // const previousApiReqIndex = findLastIndex(
    //   this.clineMessages,
    //   (m) => m.say === 'api_req_started'
    // )
    await this.say(
      'api_req_started',
      JSON.stringify({
        request: 'start request Loading...'
      })
    )

    await this.addToApiConversationHistory({
      role: 'user',
      content: userContent
    })
    console.log("apiConversationHistory: ", this.apiConversationHistory)
    console.log("clineMessages: ", this.clineMessages)

    const lastApiReqIndex = this.findLastIndex(
      this.clineMessages,
      (m) => m.say === 'api_req_started'
    )
    this.clineMessages[lastApiReqIndex].text = JSON.stringify({
      request: userContent.map(() => '[Text:] or [Tool Use:]')
    })
    // 更新最后一个clineMessage
    await this.saveClineMessagesAndUpdateHistory(this.clineMessages[lastApiReqIndex])

    // 发起api请求
    const assistantMessage = await this.attemptApiRequest(this.apiConversationHistory)
    this.assistantMessageContent = parseAssistantMessage(assistantMessage)

    // present content to user
    this.presentAssistantMessage()

    await this.addToApiConversationHistory(assistantMessage)
  }

  async presentAssistantMessage() {
    // Handle the message block from assistantMessageContent
    const block = this.assistantMessageContent
    const { type, content } = block

    switch (type) {
      case 'text': {
        await this.say('text', content)
        break
      }
      case 'tool_use': {
        await this.say('tool', content)
        break
      }
      default: {
        console.warn('Unknown message type:', type)
        break
      }
    }
  }

  async say(type, text) {
    const sayTs = Date.now()
    await this.addToClineMessages({
      ts: sayTs,
      type: 'say',
      say: type,
      text
    })
  }

  async addToClineMessages(message) {
    this.clineMessages.push(message)
    await this.saveClineMessagesAndUpdateHistory(message)
  }

  async addToApiConversationHistory(message) {
    this.apiConversationHistory.push(message)
    await useChatStore.getState().saveApiConversationHistory(message)
  }

  async saveClineMessagesAndUpdateHistory(message) {
    useChatStore.getState().saveClineMessages(message)
  }

  findLastIndex(array, predicate) {
    let l = array.length
    while (l--) {
      if (predicate(array[l], l, array)) {
        return l
      }
    }
    return -1
  }

  async attemptApiRequest(messages) {
    return await fetch('/api/message-flow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages })
    }).then((res) => res.json())
  }

  async handleToolUse(_toolData, metadata) {
    const copilotMessage = {
      ts: Date.now(),
      type: 'say',
      say: 'tool',
      text: JSON.stringify({
        tool: metadata.name || 'unknown',
        content: `Tool was used successfully.`
      })
    }

    const apiMessage = {
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: `Tool ${metadata.name || 'unknown'} was used successfully.`
        }
      ]
    }

    return { copilotMessage, apiMessage }
  }
}

export default Task
