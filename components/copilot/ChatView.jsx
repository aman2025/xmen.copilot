'use client'

import React, { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import useChatStore from '../../store/useChatStore'
import useGlobalStore from '../../store/useGlobalStore'
import { CheckCircle2, XCircle, User, Loader2, Wrench, ChevronsUpDown, Brain, ChevronDown, ChevronRight } from 'lucide-react'
import FileAttachment from './FileAttachment'
import { extractFileAttachments, hasFileAttachments, extractThinkingContent } from '../../utils/messageParser'

// --- CopilotAvatar Component ---
const CopilotAvatar = () => {
  return (
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center">
      <img src="/copilot-icon.svg" alt="Copilot" className="h-6 w-6" />
    </div>
  )
}



// --- Helper functions to parse message content ---
const parseResultContent = (content) => {
  const resultMatch = content.match(/<result>(.*?)<\/result>/s)
  return resultMatch ? resultMatch[1].trim() : null
}

const parseEnvironmentDetails = (content) => {
  const envMatch = content.match(/<environment_details>(.*?)<\/environment_details>/s)
  return envMatch ? envMatch[1].trim() : null
}

// --- Component for expandable result and environment details ---
const ExpandableResultBlock = ({
  resultContent,
  environmentDetails,
  contentType = 'task'
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!resultContent && !environmentDetails) {
    return null
  }

  const getHeaderText = () => {
    if (resultContent && environmentDetails) {
      return contentType === 'result'
        ? 'Result & Environment Details'
        : 'Task & Environment Details'
    }
    if (resultContent) {
      return contentType === 'result' ? 'Result Details' : 'Task Details'
    }
    return 'Environment Details'
  }

  const getContentLabel = () => {
    return contentType === 'result' ? 'RESULT:' : 'TASK:'
  }

  return (
    <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {getHeaderText()}
        </span>
        <ChevronsUpDown size={16} className="text-gray-500 dark:text-gray-400" />
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 p-3 dark:border-gray-700">
          {resultContent && (
            <div className="mb-3">
              <div className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                {getContentLabel()}
              </div>
              <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200">
                {resultContent}
              </pre>
            </div>
          )}

          {environmentDetails && (
            <div>
              <div className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                ENVIRONMENT DETAILS:
              </div>
              <pre className="whitespace-pre-wrap text-xs text-gray-600 dark:text-gray-400">
                {environmentDetails}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// --- Component for expandable thinking content ---
const ThinkingBlock = ({ thinkingContent }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!thinkingContent) {
    return null
  }

  return (
    <div className="mb-3 rounded-md border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Thinking
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown size={16} className="text-gray-500 dark:text-gray-400" />
        ) : (
          <ChevronRight size={16} className="text-gray-500 dark:text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 p-3 dark:border-gray-700">
          <div className="prose prose-sm max-w-none text-gray-500 dark:prose-invert dark:text-gray-400">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{thinkingContent}</ReactMarkdown>
          </div>
        </div>
      )}
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
const ApiRequestMessage = ({ message, isCompleted = false, hasError = false }) => {
  let taskContent = ''
  let toolResult = null
  let isToolExecution = false
  let resultContent = null
  let environmentDetails = null

  try {
    const parsedData = JSON.parse(message.text || '{}')
    taskContent = parsedData.request || ''
    toolResult = parsedData.toolResult || null

    // Check if this is a tool execution (starts with "Executing" or "Processing tool result")
    if (taskContent.startsWith('Executing ') && taskContent.endsWith('...')) {
      isToolExecution = true
    } else if (taskContent.startsWith('Processing tool result')) {
      isToolExecution = true
    }

    // For API request messages, we need to handle the content differently
    // First, try to parse enhanced content from the request field
    if (taskContent) {
      resultContent = parseResultContent(taskContent)
      environmentDetails = parseEnvironmentDetails(taskContent)

      // Extract clean task content from enhanced format
      if (taskContent.includes('</environment_details>')) {
        const parts = taskContent.split('</environment_details>')
        const taskPart = parts[0]
        // Extract content between <task> tags
        const taskMatch = taskPart.match(/<task>(.*?)<\/task>/s)
        taskContent = taskMatch
          ? taskMatch[1].trim()
          : taskPart.replace('<task>', '').replace('</task>', '').trim()
      } else if (taskContent.includes('<task>')) {
        const taskMatch = taskContent.match(/<task>(.*?)<\/task>/s)
        taskContent = taskMatch
          ? taskMatch[1].trim()
          : taskContent.replace('<task>', '').replace('</task>', '').trim()
      }
    }

    // For tool executions, use toolResult as result content
    if (isToolExecution && toolResult && !resultContent) {
      resultContent =
        typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult, null, 2)
    }

    // For regular API requests (non-tool executions), use the cleaned task content as result
    if (!isToolExecution && taskContent && !resultContent) {
      resultContent = taskContent
    }

    // Only generate environment details if we don't already have them from parsing
    if ((isCompleted || isToolExecution || resultContent) && !environmentDetails) {
      const globalState = useGlobalStore.getState()
      const { user, system } = globalState

      // Create basic environment details
      environmentDetails = `# User Information
    Name: ${user?.name || user?.username || 'Unknown'}
    Email: ${user?.email || 'Unknown'}

# System Information
    Mode: ${system?.mode || 'Unknown'}
    Version: ${system?.version || 'Unknown'}
    Timestamp: ${new Date().toISOString()}

# Task Context
    Chat ID: ${message.chatId || 'Unknown'}
    Task Status: ${isCompleted ? 'Completed' : 'Active'}
    Tool Name: ${isToolExecution ? 'tool_execution' : 'api_request'}`
    }
  } catch (e) {
    taskContent = message.text || ''
    // Try to parse result and environment details from raw text
    resultContent = parseResultContent(taskContent)
    environmentDetails = parseEnvironmentDetails(taskContent)
  }

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center">
        {hasError ? (
          <XCircle size={18} className="mr-1.5 text-red-500" />
        ) : isCompleted ? (
          <CheckCircle2 size={18} className="mr-1.5 text-green-500" />
        ) : (
          <Loader2 size={16} className="mr-1.5 animate-spin text-blue-500" />
        )}
        <span className="font-medium text-gray-700 dark:text-gray-300">
          API Request{isCompleted || hasError ? '' : '...'}
        </span>
      </div>

      {/* Show expandable result and environment details block */}
      <ExpandableResultBlock
        resultContent={resultContent}
        environmentDetails={environmentDetails}
        contentType={isToolExecution ? 'result' : 'task'}
      />

      {/* Show task content for non-tool executions when no result/environment details */}
      {!isToolExecution && !resultContent && !environmentDetails && taskContent && (
        <pre className="whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-200">
          {taskContent.includes('<task>') ? taskContent : `<task>${taskContent}</task>`}
        </pre>
      )}
    </div>
  )
}

// --- Add a new component for Tool Approval Request ---
const ToolApprovalRequest = ({ message }) => {
  const { isWaitingForApproval } = useChatStore()
  let toolData = {}
  try {
    toolData = JSON.parse(message.text)
  } catch (e) {
    return (
      <div className="text-red-500">
        <p className="font-medium">Malformed Tool Request</p>
        <pre className="my-2 rounded bg-gray-100 p-2 text-xs dark:bg-gray-800">{message.text}</pre>
      </div>
    )
  }

  const isHistorical = !isWaitingForApproval

  return (
    <div className="flex flex-col space-y-3">
      <div className="flex-grow">
        <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-2 flex items-center">
            <Wrench size={16} className="mr-1.5 text-blue-500" />
            <span className="font-medium text-gray-800 dark:text-gray-200">
              Copilot wants to execute this tool:
            </span>
            {isHistorical && <CheckCircle2 size={16} className="ml-2 text-green-500" />}
          </div>

          <div className="text-sm text-gray-700 dark:text-gray-300">
            Request: {toolData.tool || 'Unknown'}
            <br />
            Execute {toolData.tool || 'Unknown'} with parameters:
            <br />
            <pre className="mt-1 whitespace-pre-wrap text-xs">
              {JSON.stringify(toolData.parameters || {}, null, 2)}
            </pre>
          </div>
        </div>

        {!isHistorical && (
          <p className="mt-2 text-sm italic text-gray-500 dark:text-gray-400">
            waiting for user approving...
          </p>
        )}
      </div>
    </div>
  )
}

// --- MessageItem Component ---
const MessageItem = ({ message }) => {
  const renderContent = () => {
    // Handle user messages with potential file attachments
    if (message.role === 'user') {
      const messageText = message.text || ''

      // Check if this user message contains file attachments
      if (hasFileAttachments(messageText)) {
        const { cleanText, attachments } = extractFileAttachments(messageText)

        return (
          <div className="space-y-2">
            {/* Display the clean message text if it exists */}
            {cleanText && (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleanText}</ReactMarkdown>
              </div>
            )}

            {/* Display file attachments */}
            {attachments.map((attachment) => (
              <FileAttachment key={attachment.id} attachment={attachment} />
            ))}
          </div>
        )
      }

      // Regular user message without file attachments
      return (
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{messageText}</ReactMarkdown>
        </div>
      )
    }

    // Handle direct assistant messages (role === 'assistant' without type === 'say')
    if (message.role === 'assistant' && message.type !== 'say') {
      const messageText = message.text || message.content || ''
      const { thinkingContent, cleanText: textWithoutThinking } = extractThinkingContent(messageText)

      // Build the content components
      const components = []

      // Add thinking block if present
      if (thinkingContent) {
        components.push(
          <ThinkingBlock key="thinking" thinkingContent={thinkingContent} />
        )
      }

      // Add main content if present
      if (textWithoutThinking) {
        components.push(
          <div key="content" className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{textWithoutThinking}</ReactMarkdown>
          </div>
        )
      }

      // Return components or fallback to original text
      if (components.length > 0) {
        return (
          <div className="flex flex-col space-y-2">
            {components}
          </div>
        )
      }

      return (
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{messageText}</ReactMarkdown>
        </div>
      )
    }

    if (message.type === 'ask' && message.ask === 'call_sys_tool') {
      return <ToolApprovalRequest message={message} />
    }

    if (message.type === 'say') {
      switch (message.say) {
        case 'api_req_started':
          // Check if the message has a status field indicating completion or error
          let isCompleted = false
          let hasError = false
          try {
            const parsedData = JSON.parse(message.text || '{}')
            isCompleted = parsedData.status === 'completed'
            hasError = parsedData.status === 'error'
          } catch (e) {
            // If parsing fails, check the old way
            isCompleted = message.status === 'completed'
            hasError = message.status === 'error'
          }
          return (
            <ApiRequestMessage message={message} isCompleted={isCompleted} hasError={hasError} />
          )
        case 'text':
        default:
          // Check if the message contains thinking, result and environment details
          const messageText = message.text || ''
          const { thinkingContent, cleanText: textWithoutThinking } = extractThinkingContent(messageText)
          const resultContent = parseResultContent(textWithoutThinking)
          const environmentDetails = parseEnvironmentDetails(textWithoutThinking)

          // Build the content components
          const components = []

          // Add thinking block if present
          if (thinkingContent) {
            components.push(
              <ThinkingBlock key="thinking" thinkingContent={thinkingContent} />
            )
          }

          // Add result/environment block if present
          if (resultContent || environmentDetails) {
            components.push(
              <ExpandableResultBlock
                key="result"
                resultContent={resultContent}
                environmentDetails={environmentDetails}
                contentType="result"
              />
            )
          }

          // Calculate final clean text after removing all special tags
          let finalCleanText = textWithoutThinking
          if (resultContent) {
            finalCleanText = finalCleanText.replace(/<result>.*?<\/result>/s, '').trim()
          }
          if (environmentDetails) {
            finalCleanText = finalCleanText
              .replace(/<environment_details>.*?<\/environment_details>/s, '')
              .trim()
          }

          // Add main content if present
          if (finalCleanText) {
            components.push(
              <div key="content" className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{finalCleanText}</ReactMarkdown>
              </div>
            )
          }

          // Return components or fallback to original text
          if (components.length > 0) {
            return (
              <div className="flex flex-col space-y-2">
                {components}
              </div>
            )
          }

          return (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{messageText}</ReactMarkdown>
            </div>
          )
      }
    }
    return <pre className="text-xs">{JSON.stringify(message, null, 2)}</pre>
  }

  return <div className="rounded-lg bg-white px-4 py-2 dark:bg-gray-800">{renderContent()}</div>
}

// --- ChatView Component ---
const ChatView = () => {
  const { clineMessages, isLoading } = useChatStore()
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [clineMessages, isLoading])

  const displayMessages = [...(clineMessages || [])]
    .filter((message) => message && message.ts != null && !isNaN(Number(message.ts)))
    .sort((a, b) => Number(a.ts) - Number(b.ts))

  return (
    <div className="flex h-full flex-col">
      <div className="scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 flex-1 space-y-4 overflow-y-auto p-4">
        {displayMessages.map((message, index) => {
          const isUser = message.role === 'user'
          const isApiRequest = message.type === 'say' && message.say === 'api_req_started'

          // Handle API requests (including tool executions) without avatar/label
          if (isApiRequest) {
            // Check if the message has a status field indicating completion or error
            let isCompleted = false
            let hasError = false
            try {
              const parsedData = JSON.parse(message.text || '{}')
              isCompleted = parsedData.status === 'completed'
              hasError = parsedData.status === 'error'
            } catch (e) {
              // If parsing fails, check the old way
              isCompleted = message.status === 'completed'
              hasError = message.status === 'error'
            }

            // For historical chats, any api_req_started message without a final status
            // should be considered completed, as the task is no longer active.
            // We use !isLoading to infer that we are not in the middle of a live request.
            if (!isLoading && !isCompleted && !hasError) {
              isCompleted = true
            }

            return (
              <div key={`${message.ts}-${index}`}>
                <ApiRequestMessage
                  message={message}
                  isCompleted={isCompleted}
                  hasError={hasError}
                />
              </div>
            )
          }

          // Render user messages and other assistant messages
          if (isUser || message.role === 'assistant' || message.type === 'ask') {
            // Check if this is a ToolApprovalRequest that should be displayed without avatar
            const isToolApproval = message.type === 'ask' && message.ask === 'call_sys_tool'
            const shouldHideAvatar = isToolApproval && index > 0 && (() => {
              // Check if the previous message is an assistant text message
              const prevMessage = displayMessages[index - 1]
              return prevMessage &&
                     prevMessage.type === 'say' &&
                     prevMessage.say === 'text' &&
                     prevMessage.role === 'assistant' // Assistant messages from Task.say() with role set
            })()

            if (shouldHideAvatar) {
              // Render ToolApprovalRequest without avatar for tool_use_with_content case
              return (
                <div key={`${message.ts}-${index}`} className="ml-11">
                  <MessageItem message={message} />
                </div>
              )
            }

            return (
              <div key={`${message.ts}-${index}`} className="flex items-start gap-3">
                {isUser ? (
                  <UserAvatar />
                ) : (
                  <CopilotAvatar />
                )}
                <div className="flex flex-col">
                  <span className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {isUser ? 'You' : 'Xmen Copilot'}
                  </span>
                  <MessageItem message={message} />
                </div>
              </div>
            )
          }

          // Fallback for messages without a role (like system messages)
          return (
            <div key={`${message.ts}-${index}`} className="flex items-start gap-3">
              <div className="flex flex-col">
                <MessageItem message={message} />
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

export default ChatView
