'use client'

import React from 'react'
import useChatStore from '../../store/useChatStore'
import { handleResponse as handleResponseAction } from '../../store/chatActions'

const ChatView = () => {
  const { clineMessages, isLoading } = useChatStore()

  // Filter out messages without timestamps and sort by timestamp
  const allMessages = [...(clineMessages || [])]
    .filter((message) => message && typeof message.ts === 'number')
    .sort((a, b) => a.ts - b.ts)

  // Handle user response to questions or tool requests
  const handleResponse = (response) => {
    handleResponseAction(response)
  }

  // Render different message types
  const renderMessage = (message) => {
    // Handle user messages (ask type)
    if (message.type === 'ask') {
      // Parse the tool data from the text field for call_sys_tool
      if (message.ask === 'call_sys_tool') {
        let toolData = {}
        try {
          toolData = JSON.parse(message.text)
        } catch (e) {
          // Silent fail and use empty object
        }

        return (
          <div className="copilot-message tool-approval">
            <div className="message-content">
              <p className="font-medium">Tool Execution Request</p>
              <p>
                Tool: <span className="font-semibold">{toolData.tool || 'Unknown tool'}</span>
              </p>
              <p>Description: {toolData.description || 'No description provided'}</p>
              <pre className="my-2 rounded bg-gray-100 p-2 text-sm dark:bg-gray-800">
                {JSON.stringify(toolData.parameters, null, 2)}
              </pre>
              <div className="mt-3 flex space-x-2">
                <button
                  onClick={() => handleResponse('approve')}
                  className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleResponse('reject')}
                  className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )
      }

      return (
        <div className="user-message">
          <div className="message-content">{message.text}</div>
        </div>
      )
    }

    // Handle AI messages (say type with different 'say' values)
    if (message.type === 'say') {
      switch (message.say) {
        case 'api_req_started':
          // Optionally show a loading indicator or API request info
          return (
            <div className="copilot-message api-request">
              <div className="message-content">
                <p>Processing request...</p>
              </div>
            </div>
          )

        case 'tool':
          // Parse the tool data from the text field
          let toolData = {}
          try {
            toolData = JSON.parse(message.text)
          } catch (e) {
            // Silent fail and use empty object
          }

          return (
            <div className="copilot-message tool">
              <div className="message-content">
                <p>Using tool: {toolData.tool || 'Unknown tool'}</p>
                <pre className="tool-metadata">{message.text}</pre>
              </div>
            </div>
          )

        case 'tool_result':
          // Parse the tool result data
          let resultData = {}
          try {
            resultData = JSON.parse(message.text)
          } catch (e) {
            // Silent fail and use empty object
          }

          return (
            <div className="copilot-message tool-result">
              <div className="message-content">
                <p className="font-medium">Tool Result: {resultData.tool || 'Unknown tool'}</p>
                <pre className="my-2 rounded bg-gray-100 p-2 text-sm dark:bg-gray-800">
                  {JSON.stringify(resultData.result, null, 2)}
                </pre>
              </div>
            </div>
          )

        case 'completion_result':
          return (
            <div className="copilot-message completion">
              <div className="message-content">
                <p>{message.text}</p>
              </div>
            </div>
          )

        case 'error':
          return (
            <div className="copilot-message error">
              <div className="message-content">
                <p>{message.text}</p>
              </div>
            </div>
          )

        default:
          return (
            <div className="copilot-message">
              <div className="message-content">{message.text}</div>
            </div>
          )
      }
    }

    // Fallback for any other message types
    return (
      <div className="copilot-message">
        <div className="message-content">
          {message && typeof message.text === 'string'
            ? message.text
            : JSON.stringify(message || {})}
        </div>
      </div>
    )
  }

  return (
    <div className="chat-view">
      <div className="messages-container">
        {allMessages.map((message, index) => (
          <div key={`${message.type}-${message.ts}-${index}`} className="message-row border-b p-2">
            {renderMessage(message)}
          </div>
        ))}
        {isLoading && (
          <div className="loading-indicator">
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatView
