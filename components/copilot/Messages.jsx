import { useState, useEffect } from 'react'

const Messages = ({ chatId }) => {
  const [messages, setMessages] = useState([])

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

  return (
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
  )
}

export default Messages
