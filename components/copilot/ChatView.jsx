'use client'

import React, { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import useChatStore from '../../store/useChatStore'
import useGlobalStore from '../../store/useGlobalStore'
import { handleResponse as handleApprovalResponseAction } from '../../store/chatActions'
import { CheckCircle2, AlertTriangle, XCircle, Info, SendHorizontal, User, Loader2, Wrench } from 'lucide-react'

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

// --- ApiRequestMessage Component ---
const ApiRequestMessage = ({ message }) => {
  // Parse task content if available
  let taskContent = ''
  
  // Get environment details from useGlobalStore
  const globalStore = useGlobalStore.getState()
  const userInfo = globalStore.user || { name: 'ZR', email: '42589963@qq.com' }
  const systemInfo = globalStore.system || { mode: 'ESIM', version: '1.0.40' }
  
  try {
    // Try to parse the message text as JSON
    const parsedData = JSON.parse(message.text || '{}')
    taskContent = parsedData.request || ''
    
    // Check if the message contains environment details
    if (taskContent.includes('</environment_detail>')) {
      const parts = taskContent.split('</environment_detail>')
      if (parts.length > 1) {
        taskContent = parts[0].replace('<task>', '').replace('</task>', '')
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
    <div className="flex flex-col space-y-2">
      <div className="flex items-center">
        {isCompleted ? (
          <CheckCircle2 size={18} className="mr-1.5 text-green-500" />
        ) : (
          <Loader2 size={16} className="mr-1.5 animate-spin text-blue-500" />
        )}
        <span className="font-semibold text-gray-700 dark:text-gray-300">API Request{isCompleted ? "" : "..."}</span>
      </div>
      
      <pre className="mt-2 whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200">
{`<task>
${taskContent}
</task>

<environment_details>
# User info
      Name: ${userInfo.name}
      Email: ${userInfo.email}
# System info
      Mode: ${systemInfo.mode}
      Version: ${systemInfo.version}
</environment_details>`}
      </pre>
    </div>
  )
}

// --- Add a new component for Tool Approval Request ---
const ToolApprovalRequest = ({ message }) => {
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
    <div className="flex flex-col space-y-3">
      <div className="flex-grow">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          I'll analyze tools defination and your request. I'll find out the tool '{toolData.tool || 'Unknown'}' is proper.
        </p>
        
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
          Here is the tool name and parameters:
        </p>
        
        <div className="rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800 mt-2">
          <div className="mb-2 flex items-center">
            <Wrench size={16} className="mr-1.5 text-blue-500" />
            <span className="font-medium text-gray-800 dark:text-gray-200">
              Copilot wants to execute this tool:
            </span>
          </div>
          
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Request: {toolData.tool || 'Unknown'}
            <br />
            Execute {toolData.tool || 'Unknown'} with parameters:
            <br />
            {JSON.stringify(toolData.parameters || {}, null, 2)}
          </div>
        </div>
        
        <p className="text-sm italic text-gray-500 dark:text-gray-400 mt-2">
          waiting for user approving...
        </p>
      </div>
    </div>
  )
}

// --- MessageItem Component ---
const MessageItem = ({ message }) => {
  const { setMessageInput, isFullscreen } = useChatStore()

  const renderContent = () => {
    if (message.type === 'ask' && message.ask === 'call_sys_tool') {
      return <ToolApprovalRequest message={message} />
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
  
  // Determine sender for styling
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
  } else {
    // User message
    bubbleClass += ' bg-blue-500 dark:bg-blue-600 text-white'
  }

  return <div className={bubbleClass}>{renderContent()}</div>
}

// --- Add a new component for the Copilot label ---
const CopilotLabel = () => {
  return (
    <div className="mb-1 flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
      <img src="/copilot-icon.svg" alt="Copilot" className="mr-1.5 h-4 w-4" />
      Xmen Copilot
    </div>
  )
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

          // Check if this is the first assistant message after a user message
          const isPreviousMessageFromUser = index > 0 && 
            !isAssistantMessage(displayMessages[index-1]) && 
            isAssistantMsg && 
            message.type !== 'say' && 
            message.say !== 'api_req_started';

          return (
            <div key={`${message.ts}-${index}-${message.subType || message.say}`}>
              {isPreviousMessageFromUser && <CopilotLabel />}
              <div
                className={`flex items-start gap-2.5 ${isAssistantMsg ? 'justify-start' : 'justify-end'}`}
              >
                {isAssistantMsg && <CopilotAvatar />}
                <MessageItem message={enhancedMessage} />
                {!isAssistantMsg && <UserAvatar />}
              </div>
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

// --- Add a helper function to determine if a message is from the assistant ---
const isAssistantMessage = (message) => {
  return message.type === 'ask' ||
    (message.type === 'say' &&
      ['tool_result', 'completion_result', 'error', 'tool_execution_started', 'api_req_started'].includes(
        message.say
      )) ||
    message.role === 'assistant';
}

export default ChatView















