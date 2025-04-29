'use client'

import React from 'react'
import useChatStore from '../../store/useChatStore'
import { handleResponse as handleResponseAction } from '../../store/chatActions'

const ChatView = () => {
  const { clineMessages, isLoading } = useChatStore()

  // Sort messages by timestamp
  const allMessages = [...clineMessages].sort((a, b) => a.ts - b.ts)

  // Handle user response to questions or tool requests
  const handleResponse = (response, text) => {
    handleResponseAction(response, text)
  }

  // Render different message types
  const renderMessage = (message) => {
    // Handle user messages (ask type)
    if (message.type === 'ask') {
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
                <div className="button-container">
                  <button onClick={() => handleResponse('approve')} className="approve-button">
                    Approve
                  </button>
                  <button onClick={() => handleResponse('reject')} className="reject-button">
                    Reject
                  </button>
                </div>
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
        <div className="message-content">{message.text || JSON.stringify(message)}</div>
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
