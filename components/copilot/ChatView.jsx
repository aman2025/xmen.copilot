'use client'

import React, { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import useChatStore from '../../store/useChatStore'
import useGlobalStore from '../../store/useGlobalStore'
import { handleResponse as handleApprovalResponseAction } from '../../store/chatActions'
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  SendHorizontal,
  User,
  Loader2,
  Wrench
} from 'lucide-react'

// --- CopilotAvatar Component ---
const CopilotAvatar = () => {
  return (
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center">
      <img src="/copilot-icon.svg" alt="Copilot" className="h-6 w-6" />
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
  let isToolExecution = false

  try {
    const parsedData = JSON.parse(message.text || '{}')
    taskContent = parsedData.request || ''

    // Check if this is a tool execution (starts with "Executing")
    if (taskContent.startsWith('Executing ') && taskContent.endsWith('...')) {
      isToolExecution = true
    }

    // Handle regular API requests
    if (taskContent.includes('</environment_detail>')) {
      const parts = taskContent.split('</environment_detail>')
      taskContent = parts[0].replace('<task>', '').replace('</task>', '')
    } else if (taskContent.includes('<task>')) {
      taskContent = taskContent.replace('<task>', '').replace('</task>', '')
    }
  } catch (e) {
    taskContent = message.text || ''
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
      {/* Only show task content for non-tool executions or if it's not a simple tool execution message */}
      {!isToolExecution && (
        <pre className="whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-200">
          {taskContent.includes('<task>') ? taskContent : `<task>${taskContent}</task>`}
        </pre>
      )}
    </div>
  )
}

// --- Add a new component for Tool Approval Request ---
const ToolApprovalRequest = ({ message }) => {
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

  return (
    <div className="flex flex-col space-y-3">
      <div className="flex-grow">
        <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
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
            <pre className="mt-1 whitespace-pre-wrap text-xs">
              {JSON.stringify(toolData.parameters || {}, null, 2)}
            </pre>
          </div>
        </div>

        <p className="mt-2 text-sm italic text-gray-500 dark:text-gray-400">
          waiting for user approving...
        </p>
      </div>
    </div>
  )
}

// --- MessageItem Component ---
const MessageItem = ({ message }) => {
  const renderContent = () => {
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
          return (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text || ''}</ReactMarkdown>
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
            return (
              <div key={`${message.ts}-${index}`} className="flex items-start gap-3">
                {isUser ? <UserAvatar /> : <CopilotAvatar />}
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
