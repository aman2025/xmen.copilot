/**
 * Get raw file content for AI processing
 * @param {string} content - Raw file content as string
 * @param {string} fileName - Name of the file to determine format
 * @returns {Promise<string>} Raw content string for AI processing
 * @throws {Error} If file format is unsupported
 */
export const parseFileContent = async (content, fileName) => {
  const extension = getFileExtension(fileName)

  // Validate that the file format is supported
  if (!isSupportedFileFormat(fileName)) {
    throw new Error(`Unsupported file format: ${extension}`)
  }

  // Return raw content directly for AI processing
  // AI models can better understand and parse raw content contextually
  return content
}

/**
 * Get file extension from filename
 * @param {string} fileName - Name of the file
 * @returns {string} File extension in lowercase
 */
const getFileExtension = (fileName) => {
  return fileName.toLowerCase().split('.').pop()
}

/**
 * Get appropriate file format label for display
 * @param {string} fileName - Name of the file
 * @returns {string} Format label (e.g., 'YAML File', 'JSON File', 'XML File')
 */
export const getFileFormatLabel = (fileName) => {
  const extension = getFileExtension(fileName)

  switch (extension) {
    case 'json':
      return 'JSON File'
    case 'yml':
    case 'yaml':
      return 'YAML File'
    case 'xml':
      return 'XML File'
    default:
      return 'File'
  }
}

/**
 * Check if file format is supported
 * @param {string} fileName - Name of the file
 * @returns {boolean} True if format is supported
 */
export const isSupportedFileFormat = (fileName) => {
  const extension = getFileExtension(fileName)
  return ['json', 'yml', 'yaml', 'xml'].includes(extension)
}

/**
 * Get supported file extensions as accept string for input
 * @returns {string} Accept string for file input
 */
export const getSupportedFileExtensions = () => {
  return '.json,.yml,.yaml,.xml'
}

/**
 * Get human-readable list of supported formats
 * @returns {string} Human-readable format list
 */
export const getSupportedFormatsText = () => {
  return 'JSON, YAML, and XML files'
}
