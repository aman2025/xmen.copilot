import { useState, useEffect } from 'react'
import { Send } from 'lucide-react'

const Messages = ({ chatId }) => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Fetch messages when chatId changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!chatId) return

      try {
        const res = await fetch(`/api/chat/${chatId}/messages`)
        const data = await res.json()
        if (data.messages) {
          setMessages(data.messages)
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error)
      }
    }

    fetchMessages()
  }, [chatId])

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
        setMessages((prev) => [...prev, data.message])
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
      {/* Messages list */}
      <div className="mb-4 flex-1 space-y-4 overflow-y-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`rounded-lg p-3 ${
              message.role === 'user'
                ? 'ml-auto bg-blue-100 dark:bg-blue-900'
                : 'mr-auto bg-gray-100 dark:bg-gray-700'
            } max-w-[80%]`}
          >
            {message.content}
          </div>
        ))}
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 rounded-md border p-2 text-gray-800 dark:bg-gray-700 dark:text-white"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-blue-500 p-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {isLoading ? 'Sending...' : <Send size={20} />}
        </button>
      </form>
    </div>
  )
}

export default Messages
