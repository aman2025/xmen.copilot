'use client'

import { useEffect, useState } from 'react'
import ChatInput from './ChatInput'
import ChatView from './ChatView'
import useChatStore from '../../store/useChatStore'
import {
  initController,
  sendMessage,
  handleResponse as handleApprovalResponseAction
} from '../../store/chatActions'
import { SendHorizontal, MessageSquarePlus } from 'lucide-react'

const ChatBox = ({ presetQuestions, onPresetQuestionClick }) => {
  const { currentChatId, isLoading, clineMessages, isWaitingForApproval } = useChatStore()
  const [pendingToolApproval, setPendingToolApproval] = useState(null)
  const [hasUserResponded, setHasUserResponded] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      initController()
    }
  }, [])

  // Check for pending tool approval requests in messages
  useEffect(() => {
    // Find the most recent tool approval message (highest timestamp)
    const toolApprovalMessages = clineMessages.filter(
      (msg) => msg.type === 'ask' && msg.ask === 'call_sys_tool'
    )

    const toolApprovalMessage =
      toolApprovalMessages.length > 0
        ? toolApprovalMessages.reduce((latest, current) =>
            current.ts > latest.ts ? current : latest
          )
        : null

    // If we have a new tool approval message (different timestamp), reset the response state
    if (
      toolApprovalMessage &&
      (!pendingToolApproval || toolApprovalMessage.ts !== pendingToolApproval.ts)
    ) {
      setHasUserResponded(false)
    }

    setPendingToolApproval(toolApprovalMessage)
  }, [clineMessages, pendingToolApproval])

  const handlePresetQuestionClickInternal = (question) => {
    if (!currentChatId) {
      sendMessage(question)
    } else {
      onPresetQuestionClick(question)
    }
  }

  const handleToolApproval = (response) => {
    if (!pendingToolApproval || hasUserResponded) return

    // Mark that user has responded to prevent multiple clicks
    setHasUserResponded(true)

    handleApprovalResponseAction(response)
    // Don't set pendingToolApproval to null immediately - let it be handled by the next message update
  }

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-800">
      <div className="flex-1 overflow-hidden">
        {currentChatId || clineMessages.length > 0 || isLoading ? (
          <ChatView />
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <MessageSquarePlus className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
              Start a conversation
            </h2>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              Ask me anything or choose a suggestion below.
            </p>
            <div className="w-full max-w-md space-y-2">
              {presetQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handlePresetQuestionClickInternal(question)}
                  className="flex w-full items-center gap-2 rounded-lg border border-gray-200 p-3 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700/50"
                >
                  <SendHorizontal size={16} className="text-blue-500" />
                  <span>{question}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tool Approval Bar */}
      {pendingToolApproval && !hasUserResponded && isWaitingForApproval && (
        <div className="flex border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => handleToolApproval('approve')}
            className="flex-1 bg-green-500 py-3 font-medium text-white transition-colors hover:bg-green-600"
          >
            Approve
          </button>
          <button
            onClick={() => handleToolApproval('reject')}
            className="flex-1 border-l border-gray-200 bg-red-500 py-3 font-medium text-white transition-colors hover:bg-red-600 dark:border-gray-600"
          >
            Reject
          </button>
        </div>
      )}

      <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
        <ChatInput placeholder={currentChatId ? 'Type your message...' : 'Start a new chat...'} />
      </div>
    </div>
  )
}

export default ChatBox
