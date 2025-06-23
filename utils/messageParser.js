/**
 * Utility functions for parsing file attachments from chat messages
 */

/**
 * Extracts file attachments from a user message text
 * @param {string} messageText - The full message text that may contain embedded files
 * @returns {Object} - Object containing cleanText and attachments array
 */
export const extractFileAttachments = (messageText) => {
  if (!messageText || typeof messageText !== 'string') {
    return { cleanText: messageText || '', attachments: [] }
  }

  // Pattern to match file attachments: --- {formatLabel}: {fileName} ---\n{content}\n--- End of {fileName} ---
  const filePattern = /--- (.+?): (.+?) ---\n([\s\S]*?)\n--- End of \2 ---/g
  const attachments = []
  let cleanText = messageText

  let match
  while ((match = filePattern.exec(messageText)) !== null) {
    const [fullMatch, formatLabel, fileName, content] = match
    
    attachments.push({
      id: `${fileName}-${Date.now()}-${Math.random()}`,
      name: fileName,
      formatLabel: formatLabel,
      content: content.trim()
    })

    // Remove the file attachment from the clean text
    cleanText = cleanText.replace(fullMatch, '').trim()
  }

  // Clean up any extra whitespace
  cleanText = cleanText.replace(/\n\s*\n\s*\n/g, '\n\n').trim()

  return {
    cleanText,
    attachments
  }
}

/**
 * Checks if a message contains file attachments
 * @param {string} messageText - The message text to check
 * @returns {boolean} - True if the message contains file attachments
 */
export const hasFileAttachments = (messageText) => {
  if (!messageText || typeof messageText !== 'string') {
    return false
  }

  const filePattern = /--- .+?: .+? ---[\s\S]*?--- End of .+? ---/
  return filePattern.test(messageText)
}
