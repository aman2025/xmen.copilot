'use client'

import React, { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import useChatStore from '../../store/useChatStore'
import { handleResponse as handleApprovalResponseAction } from '../../store/chatActions'
import { CheckCircle2, AlertTriangle, XCircle, Info, SendHorizontal, User, Loader2 } from 'lucide-react'

// --- CopilotAvatar Component ---
const CopilotAvatar = () => {
  return (
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white">
      {/* Using a generic icon or initials if image isn't always available */}
      <SendHorizontal size={18} className="-rotate-45 transform" />
    </div>
  )
}

// --- UserAvatar Component ---
const UserAvatar = () => {
  return (
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
      <User size={18} />
    </div>
  )
}

// --- Add this new component for API Request state ---
const ApiRequestMessage = ({ message }) => {
  // Parse task content if available
  let taskContent = ''
  let envDetails = null
  
  try {
    // Try to parse the message text as JSON
    const parsedData = JSON.parse(message.text || '{}')
    taskContent = parsedData.request || ''
    
    // Check if the message contains environment details
    if (taskContent.includes('</environment_detail>')) {
      const parts = taskContent.split('</environment_detail>')
      if (parts.length > 1) {
        taskContent = parts[0].replace('<task>', '').replace('</task>', '')
        envDetails = parts[1]
      }
    } else if (taskContent.includes('<task>')) {
      taskContent = taskContent.replace('<task>', '').replace('</task>', '')
    }
  } catch (e) {
    // If parsing fails, use the raw text
    taskContent = message.text || ''
  }
  
  // Determine if this is a completed request or still loading
  const isCompleted = message.status === 'completed'
  
  return (
    <div className="flex items-center">
      {isCompleted ? (
        <CheckCircle2 size={18} className="mr-1.5 text-green-500" />
      ) : (
        <Loader2 size={16} className="mr-1.5 animate-spin text-blue-500" />
      )}
      <span className="font-semibold text-gray-700 dark:text-gray-300">API Request</span>
    </div>
  )
}

// --- MessageItem Component ---
const MessageItem = ({ message }) => {
  const { setMessageInput, isFullscreen } = useChatStore()

  const handleToolApproval = (response) => {
    // Assuming message.text for 'call_sys_tool' contains the JSON string with toolCallId
    let toolData = {}
    if (
      message.ask === 'call_sys_tool' ||
      (message.say === 'call_sys_tool' && message.type === 'ask')
    ) {
      // Check both conditions
      try {
        toolData = JSON.parse(message.text)
      } catch (e) {
        console.error('Failed to parse tool data for approval:', message.text, e)
      }
    }
    // The actual toolCallId might be needed by handleApprovalResponseAction if not implicit
    handleApprovalResponseAction(response) // response is 'approve' or 'reject'
  }

  const renderContent = () => {
    if (message.type === 'ask' && message.ask === 'call_sys_tool') {
      let toolData = {}
      try {
        toolData = JSON.parse(message.text)
      } catch (e) {
        console.error('Failed to parse tool data for display:', message.text, e)
        // Fallback display for unparsable tool data
        return (
          <div className="text-red-500">
            <p className="font-medium">Malformed Tool Request</p>
            <pre className="my-2 rounded bg-gray-100 p-2 text-xs dark:bg-gray-800">
              {message.text}
            </pre>
          </div>
        )
      }
      return (
        <div className="tool-approval-content">
          <p className="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Tool Execution Request:{' '}
            <span className="font-bold">{toolData.tool || 'Unknown tool'}</span>
          </p>
          {toolData.description && (
            <p className="mb-2 text-xs text-gray-600 dark:text-gray-400">{toolData.description}</p>
          )}
          <pre className="my-2 max-h-40 overflow-y-auto rounded bg-gray-50 p-2.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200">
            {JSON.stringify(toolData.parameters || {}, null, 2)}
          </pre>
          <div className="mt-3 flex space-x-2">
            <button
              onClick={() => handleToolApproval('approve')}
              className="flex-1 rounded-md bg-green-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-600"
            >
              Approve
            </button>
            <button
              onClick={() => handleToolApproval('reject')}
              className="flex-1 rounded-md bg-red-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-600"
            >
              Reject
            </button>
          </div>
        </div>
      )
    }

    // Handle 'say' type messages
    if (message.type === 'say') {
      let title = null
      let icon = null
      let content = null
      let specialClass = ''

      switch (message.say) {
        case 'api_req_started':
          // Replace the null return with our new component
          return <ApiRequestMessage message={message} />
        case 'tool_result':
          try {
            const resultData = JSON.parse(message.text)
            title = `Tool Result: ${resultData.tool || 'Unknown'}`
            icon = <Info size={16} className="mr-1.5 text-blue-500" />
            content = (
              <pre className="my-1 max-h-60 overflow-y-auto rounded bg-gray-50 p-2.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                {JSON.stringify(resultData.result, null, 2)}
              </pre>
            )
          } catch (e) {
            title = 'Tool Result (Malformed)'
            icon = <AlertTriangle size={16} className="mr-1.5 text-orange-500" />
            content = <pre className="... my-1">{message.text}</pre>
          }
          break
        case 'completion_result':
          title = 'Task Completed'
          icon = <CheckCircle2 size={18} className="mr-1.5 text-green-500" />
          content = (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              className="prose prose-sm max-w-none dark:prose-invert"
            >
              {message.text}
            </ReactMarkdown>
          )
          break
        case 'error':
          title = 'Error'
          icon = <XCircle size={16} className="mr-1.5 text-red-500" />
          content = <p className="text-sm text-red-700 dark:text-red-400">{message.text}</p>
          break
        case 'text': // Standard text from AI or User
        default: // Also catches user's 'text' messages if not handled by alignment
          content = (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              className="prose prose-sm max-w-none dark:prose-invert"
            >
              {message.text || ''}
            </ReactMarkdown>
          )
          break
      }

      return (
        <div className={`message-content-wrapper ${specialClass}`}>
          {title && (
            <div className="mb-1 flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300">
              {icon}
              {title}
            </div>
          )}
          <div>{content}</div>
        </div>
      )
    }
    // Fallback for unknown message structures
    return <pre className="text-xs">{JSON.stringify(message, null, 2)}</pre>
  }

  // Base styling for message bubbles
  let bubbleClass = 'px-3.5 py-2.5 rounded-xl max-w-[85%]' // Adjusted padding and max-width
  let alignmentClass = 'flex' // Default alignment for avatar and bubble

  // Determine sender for styling:
  // 'ask' is from Assistant.
  // 'say' can be from Assistant (tool_result, completion_result, error, AI text) or User (text).
  // We need a clearer way or rely on context. For now, if it's not 'ask', and no clear assistant 'say' type, assume user for styling.
  // A better approach would be to add a `sender: 'user' | 'assistant'` to clineMessages.
  // Let's assume for this iteration: if message.type === 'ask', it's assistant.
  // If message.type === 'say' and message.say is one of ('tool_result', 'completion_result', 'error', 'api_req_started'), it's assistant.
  // Otherwise, if message.type === 'say' and message.say === 'text', it *could* be user or assistant.
  // The `ChatView` will determine alignment. `MessageItem` just styles the bubble itself.

  const isAssistantMessage =
    message.type === 'ask' ||
    (message.type === 'say' &&
      [
        'tool_result',
        'completion_result',
        'error',
        'api_req_started',
        'tool_execution_started'
      ].includes(message.say)) ||
    message.role === 'assistant' // If role is explicitly assistant

  if (isAssistantMessage) {
    bubbleClass += ' bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
    alignmentClass += ' items-start' // Avatar at top
  } else {
    // User message
    bubbleClass += ' bg-blue-500 dark:bg-blue-600 text-white'
    alignmentClass += ' flex-row-reverse items-start' // Avatar at top, bubble on left
  }

  return <div className={bubbleClass}>{renderContent()}</div>
}

// --- ChatView Component ---
const ChatView = () => {
  const { clineMessages, isLoading, currentChatId, currentChatTitle } = useChatStore()
  const messagesEndRef = useRef(null)
  
  // Track if we should show API requests as completed
  const [apiRequestCompleted, setApiRequestCompleted] = useState(false)
  
  // When clineMessages changes, check if we should mark API requests as completed
  useEffect(() => {
    // If we have any assistant messages after an api_req_started message,
    // we can consider the API request completed
    if (clineMessages.length > 0) {
      const apiReqIndex = clineMessages.findIndex(msg => 
        msg.type === 'say' && msg.say === 'api_req_started'
      )
      
      if (apiReqIndex !== -1) {
        // Check if there are any assistant messages after the API request
        const hasAssistantMessagesAfter = clineMessages.some((msg, index) => 
          index > apiReqIndex && 
          (msg.role === 'assistant' || 
           (msg.type === 'say' && msg.say !== 'api_req_started' && msg.say !== 'error'))
        )
        
        setApiRequestCompleted(hasAssistantMessagesAfter)
      }
    }
  }, [clineMessages])
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [clineMessages, isLoading]) // Also scroll when loading state changes

  // Filter out messages without timestamps and sort by timestamp
  const displayMessages = [...(clineMessages || [])]
    .filter((message) => {
      return (
        message &&
        message.ts != null && // Check for null or undefined
        !isNaN(Number(message.ts)) // Ensure ts is a valid number or numeric string
      )
    })
    .sort((a, b) => Number(a.ts) - Number(b.ts)) // Sort by numeric value of ts

  return (
    <div className="flex h-full flex-col">
      <div className="scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 flex-1 space-y-3 overflow-y-auto p-4">
        {displayMessages.map((message, index) => {
          // Add the apiRequestCompleted flag to api_req_started messages
          let enhancedMessage = message
          if (message.type === 'say' && message.say === 'api_req_started' && apiRequestCompleted) {
            enhancedMessage = { ...message, status: 'completed' }
          }
          
          // Determine sender for alignment
          const isAssistantMsg =
            message.type === 'ask' ||
            (message.type === 'say' &&
              ['tool_result', 'completion_result', 'error', 'tool_execution_started', 'api_req_started'].includes(
                message.say
              )) ||
            message.role === 'assistant' // Explicit role check

          return (
            <div
              key={`${message.ts}-${index}-${message.subType || message.say}`}
              className={`flex items-start gap-2.5 ${isAssistantMsg ? 'justify-start' : 'justify-end'}`}
            >
              {isAssistantMsg && <CopilotAvatar />}
              <MessageItem message={enhancedMessage} />
              {!isAssistantMsg && <UserAvatar />}
            </div>
          )
        })}
        
        {/* Only show loading indicator if isLoading is true and apiRequestCompleted is false */}
        {isLoading && !apiRequestCompleted && (
          <div className="flex items-start gap-2.5 justify-start">
            <CopilotAvatar />
            <div className="px-3.5 py-2.5 rounded-xl max-w-[85%] bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100">
              <div className="flex items-center">
                <Loader2 size={16} className="mr-1.5 animate-spin text-blue-500" />
                <span className="font-semibold text-gray-700 dark:text-gray-300">API Request</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} /> {/* Anchor for scrolling to bottom */}
      </div>
    </div>
  )
}

export default ChatView





