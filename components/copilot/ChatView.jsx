'use client'

import React from 'react'
import useChatStore from '../../store/useChatStore'
import { sendMessage } from '../../store/chatActions'
import ChatInput from './ChatInput'

const ChatView = () => {
  const { userMessages, copilotMessages, isLoading, messageInput, setMessageInput } = useChatStore()

  const allMessages = [
    ...userMessages.map((msg) => ({ ...msg, isUser: true })),
    ...copilotMessages.map((msg) => ({ ...msg, isUser: false }))
  ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      sendMessage(messageInput)
    }
  }

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
          <div key={message.id} className="message-row">
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

      <ChatInput
        value={messageInput}
        onChange={(e) => setMessageInput(e.target.value)}
        onSend={handleSendMessage}
        disabled={isLoading}
        placeholder="Type a message..."
      />

      <style jsx>{`
        .chat-view {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
        }

        .message-row {
          margin-bottom: 1rem;
        }

        .user-message {
          display: flex;
          justify-content: flex-end;
        }

        .user-message .message-content {
          background-color: #e3f2fd;
          border-radius: 1rem;
          padding: 0.75rem 1rem;
          max-width: 80%;
        }

        .copilot-message {
          display: flex;
          justify-content: flex-start;
        }

        .copilot-message .message-content {
          background-color: #f5f5f5;
          border-radius: 1rem;
          padding: 0.75rem 1rem;
          max-width: 80%;
        }

        .copilot-message.question .message-content,
        .copilot-message.tool .message-content {
          background-color: #e8f5e9;
        }

        .copilot-message.error .message-content {
          background-color: #ffebee;
        }

        .button-container {
          display: flex;
          margin-top: 0.5rem;
          gap: 0.5rem;
        }

        .approve-button {
          background-color: #4caf50;
          color: white;
          border: none;
          border-radius: 0.25rem;
          padding: 0.5rem 1rem;
          cursor: pointer;
        }

        .reject-button {
          background-color: #f44336;
          color: white;
          border: none;
          border-radius: 0.25rem;
          padding: 0.5rem 1rem;
          cursor: pointer;
        }

        .tool-metadata {
          background-color: #f8f9fa;
          border-radius: 0.25rem;
          padding: 0.5rem;
          font-size: 0.875rem;
          margin: 0.5rem 0;
          overflow-x: auto;
        }

        .loading-indicator {
          display: flex;
          justify-content: center;
          margin: 1rem 0;
        }

        .loading-dots {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .loading-dots span {
          width: 0.5rem;
          height: 0.5rem;
          background-color: #9e9e9e;
          border-radius: 50%;
          animation: pulse 1.5s infinite ease-in-out;
        }

        .loading-dots span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .loading-dots span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes pulse {
          0%,
          100% {
            transform: scale(0.75);
            opacity: 0.5;
          }
          50% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

export default ChatView
