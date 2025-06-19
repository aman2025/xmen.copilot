'use client'

import { SendHorizontal, Paperclip, X } from 'lucide-react'
import useChatStore from '../../store/useChatStore'
import { sendMessage, initController } from '../../store/chatActions'
import { useEffect, useRef, useState } from 'react'

const ChatInput = () => {
  const {
    messageInput,
    setMessageInput,
    isLoading,
    attachedFiles,
    addAttachedFile,
    removeAttachedFile
  } = useChatStore()
  const fileInputRef = useRef(null)
  const [fileError, setFileError] = useState('')

  // Initialize controller on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      initController()
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!messageInput.trim() && attachedFiles.length === 0) return
    sendMessage(messageInput, attachedFiles)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleFileAttach = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || [])
    setFileError('')

    for (const file of files) {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.json')) {
        setFileError('Only JSON files are supported')
        continue
      }

      // Validate file size (limit to 1MB)
      if (file.size > 1024 * 1024) {
        setFileError('File size must be less than 1MB')
        continue
      }

      try {
        const content = await readFileAsText(file)
        const jsonContent = JSON.parse(content)

        const fileData = {
          id: `${file.name}-${Date.now()}`,
          name: file.name,
          size: file.size,
          content: jsonContent
        }

        addAttachedFile(fileData)
      } catch (error) {
        setFileError(`Error reading ${file.name}: Invalid JSON format`)
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result)
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  return (
    <div className="space-y-2">
      {/* File attachments display */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4">
          {attachedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1 text-sm dark:bg-blue-900/20"
            >
              <span className="text-blue-700 dark:text-blue-300">{file.name}</span>
              <button
                type="button"
                onClick={() => removeAttachedFile(file.id)}
                className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error message */}
      {fileError && (
        <div className="px-4 text-sm text-red-600 dark:text-red-400">
          {fileError}
        </div>
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="flex w-full items-center rounded-2xl border border-gray-200 bg-white px-4 py-[0.5rem] pr-2 dark:border-gray-600 dark:bg-gray-800">
          {/* File attachment button */}
          <button
            type="button"
            onClick={handleFileAttach}
            className="mr-2 rounded-lg p-1 text-gray-400 transition-colors hover:text-blue-600 dark:text-gray-300 dark:hover:text-gray-100"
            title="Attach JSON files"
          >
            <Paperclip className="h-4 w-4" />
          </button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          <input
            id="copilot-input"
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Copilot"
            className="flex-1 bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none dark:text-white"
            disabled={isLoading}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isLoading || (!messageInput.trim() && attachedFiles.length === 0)}
            className={`ml-2 rounded-lg p-2 transition-colors ${
              isLoading || (!messageInput.trim() && attachedFiles.length === 0)
                ? 'not-allowed text-gray-300'
                : 'text-gray-400 hover:text-blue-600 dark:text-gray-300 dark:hover:text-gray-100'
            }`}
          >
            <SendHorizontal className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  )
}

export default ChatInput
