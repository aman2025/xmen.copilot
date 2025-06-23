'use client'

import { useState } from 'react'
import { Paperclip, ChevronDown, ChevronRight } from 'lucide-react'

/**
 * Component to display file attachments in chat messages
 * Shows filename with paperclip icon, toggles content visibility on click
 */
const FileAttachment = ({ attachment }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div className="mt-2">
      {/* File header with paperclip icon and filename */}
      <button
        onClick={toggleExpanded}
        className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm transition-colors hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30"
      >
        <Paperclip className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <span className="text-blue-700 dark:text-blue-300">
          {attachment.name} ({attachment.formatLabel})
        </span>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        )}
      </button>

      {/* File content - shown when expanded */}
      {isExpanded && (
        <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-800">
          <pre className="whitespace-pre-wrap text-xs text-gray-700 dark:text-gray-300">
            {attachment.content}
          </pre>
        </div>
      )}
    </div>
  )
}

export default FileAttachment
