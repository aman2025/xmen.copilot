import { XMLParser } from 'fast-xml-parser'

/**
 * Parse file content based on file extension
 * @param {string} content - Raw file content as string
 * @param {string} fileName - Name of the file to determine format
 * @returns {Promise<Object>} Parsed content object
 * @throws {Error} If parsing fails or format is unsupported
 */
export const parseFileContent = async (content, fileName) => {
  const extension = getFileExtension(fileName)

  switch (extension) {
    case 'json':
      return parseJSON(content)
    case 'yml':
    case 'yaml':
      return await parseYAML(content)
    case 'xml':
      return parseXML(content)
    default:
      throw new Error(`Unsupported file format: ${extension}`)
  }
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
 * Parse JSON content
 * @param {string} content - JSON string content
 * @returns {Object} Parsed JSON object
 */
const parseJSON = (content) => {
  try {
    return JSON.parse(content)
  } catch (error) {
    throw new Error('Invalid JSON format')
  }
}

/**
 * Parse YAML content
 * @param {string} content - YAML string content
 * @returns {Object} Parsed YAML object
 */
const parseYAML = async (content) => {
  try {
    // Use dynamic import for client-side compatibility
    const { parse } = await import('yaml')
    return parse(content)
  } catch (error) {
    throw new Error('Invalid YAML format')
  }
}

/**
 * Parse XML content
 * @param {string} content - XML string content
 * @returns {Object} Parsed XML object
 */
const parseXML = (content) => {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseAttributeValue: true,
      parseTagValue: true,
      trimValues: true
    })
    return parser.parse(content)
  } catch (error) {
    throw new Error('Invalid XML format')
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
