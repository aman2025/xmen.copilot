import { useState } from 'react'
import Messages from './Messages'
import ChatInput from './ChatInput'

const ChatBox = ({ chatId }) => {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || !chatId) return

    setIsLoading(true)
    try {
      const res = await fetch(`/api/chat/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: input,
          role: 'user',
        }),
      })

      const data = await res.json()
      if (data.message) {
        setInput('')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <Messages chatId={chatId} />
      <ChatInput input={input} setInput={setInput} isLoading={isLoading} onSubmit={handleSubmit} />
    </div>
  )
}

export default ChatBox
