'use client'

import React from 'react'
import useChatStore from '../../store/useChatStore'

const ChatView = () => {
  const { userMessages, copilotMessages, isLoading } = useChatStore()

  const allMessages = [
    ...userMessages.map((msg) => ({ ...msg, isUser: true })),
    ...copilotMessages.map((msg) => ({ ...msg, isUser: false }))
  ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  // Render different message types
  const renderMessage = (message) => {
    if (message.isUser) {
      return (
        <div className="user-message">
          <div className="message-content">{message.content}</div>
        </div>
      )
    }

    switch (message.type) {
      case 'say':
        return (
          <div className="copilot-message">
            <div className="message-content">{message.content}</div>
          </div>
        )

      case 'ask':
        return (
          <div className="copilot-message question">
            <div className="message-content">
              <p>{message.content}</p>
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

      case 'tool':
        return (
          <div className="copilot-message tool">
            <div className="message-content">
              <p>{message.content}</p>
              {message.metadata && (
                <pre className="tool-metadata">{JSON.stringify(message.metadata, null, 2)}</pre>
              )}
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
              <p>{message.content}</p>
            </div>
          </div>
        )

      case 'error':
        return (
          <div className="copilot-message error">
            <div className="message-content">
              <p>{message.content}</p>
            </div>
          </div>
        )

      default:
        return (
          <div className="copilot-message">
            <div className="message-content">{message.content}</div>
          </div>
        )
    }
  }

  return (
    <div className="chat-view">
      <div className="messages-container">
        {allMessages.map((message) => (
          <div key={message.id} className="message-row border-b p-2">
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
