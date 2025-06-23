'use client'

import { useState } from 'react'
import FileAttachment from './FileAttachment'
import { extractFileAttachments } from '../../utils/messageParser'

/**
 * Demo component to test file attachment functionality
 * This shows how file attachments are parsed and displayed
 */
const FileAttachmentDemo = () => {
  const [demoMessage] = useState(`
Please analyze this configuration file

--- JSON File: config-data.json ---
{
  "name": "xmen-copilot",
  "version": "1.0.0",
  "features": {
    "fileUpload": true,
    "chatHistory": true,
    "aiIntegration": ["mistral", "openai"]
  },
  "settings": {
    "maxFileSize": "1MB",
    "supportedFormats": ["json", "yaml", "xml"]
  }
}
--- End of config-data.json ---

Also check this YAML configuration:

--- YAML File: app-config.yml ---
app:
  name: Xmen Copilot
  version: 1.0.0
  
database:
  type: postgresql
  host: localhost
  port: 5432
  
features:
  - file_upload
  - chat_history
  - ai_integration
--- End of app-config.yml ---
  `)

  const { cleanText, attachments } = extractFileAttachments(demoMessage)

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6 dark:bg-gray-800 dark:border-gray-600">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
          File Attachment Demo
        </h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Original Message Text:
            </h3>
            <pre className="text-xs bg-gray-100 p-3 rounded border dark:bg-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {demoMessage}
            </pre>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Parsed Clean Text:
            </h3>
            <div className="bg-gray-50 p-3 rounded border dark:bg-gray-700">
              <p className="text-sm text-gray-800 dark:text-gray-200">{cleanText}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Extracted File Attachments ({attachments.length}):
            </h3>
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <FileAttachment key={attachment.id} attachment={attachment} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FileAttachmentDemo
