'use client'

import { useState } from 'react'
import Messages from './Messages'
import ChatInput from './ChatInput'
import useChatStore from '../../store/useChatStore'

const ChatBox = () => {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { currentChatId } = useChatStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    setIsLoading(true)
    try {
      setInput('')
    } catch (error) {
      console.error('Error in chat interaction:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <Messages chatId={currentChatId} />
      <ChatInput input={input} setInput={setInput} isLoading={isLoading} onSubmit={handleSubmit} />
    </div>
  )
}

export default ChatBox
