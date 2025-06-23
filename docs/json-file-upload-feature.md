# Multi-Format File Upload Feature

## Overview

The ChatInput component now supports uploading multiple file formats as context for AI conversations. Users can attach JSON, YAML, and XML files to provide structured data context to the AI assistant.

## Features

### File Upload Support

- **File Types**: JSON (.json), YAML (.yml, .yaml), and XML (.xml) files
- **Multiple Files**: Support for uploading multiple files simultaneously
- **File Size Limit**: Maximum 1MB per file
- **Format Validation**: Automatic format validation and parsing for each supported type

### User Interface

- **Attachment Icon**: Paperclip icon positioned to the left of the text input
- **File Preview**: Visual display of attached files with names
- **Remove Files**: Individual file removal with X button
- **Error Handling**: Clear error messages for invalid files

### Integration

- **Context Inclusion**: JSON file content is automatically included in messages sent to AI
- **State Management**: Files are managed through Zustand store
- **Automatic Cleanup**: Files are cleared after message is sent

## Usage

### For Users

1. Click the paperclip icon in the chat input
2. Select one or more supported files (JSON, YAML, or XML) from your computer
3. Files will appear as tags above the input field
4. Type your message and send - the file content will be included as context
5. Remove individual files by clicking the X button on each file tag

### For Developers

The feature is implemented across several components:

#### Store Updates (`store/useChatStore.js`)

- Added `attachedFiles` array to store file data
- Added `addAttachedFile`, `removeAttachedFile`, and `clearAttachedFiles` actions

#### Chat Actions (`store/chatActions.js`)

- Updated `sendMessage` function to accept and process attached files
- File content is formatted and appended to message content

#### ChatInput Component (`components/copilot/ChatInput.jsx`)

- Added multi-format file input handling with validation
- Implemented UI for file attachment and management
- Added error handling and user feedback
- Integrated with file parser utility for format-specific parsing

#### File Parser Utility (`utils/fileParser.js`)

- Validates supported file formats (JSON, YAML, XML)
- Returns raw file content for optimal AI processing
- Provides format validation and error handling
- Includes utility functions for format checking

## File Format

All attached files are processed and included in the message context with their raw content preserved for optimal AI understanding:

### All File Types (Raw Content Preserved)

```
User message content

--- YAML File: config.yml ---
# Original YAML with comments preserved
database:
  host: localhost
  port: 5432
  # Connection settings
  timeout: 30
--- End of config.yml ---

--- JSON File: data.json ---
{
  "name": "example",
  "settings": {
    "debug": true,
    "timeout": 30
  }
}
--- End of data.json ---

--- XML File: config.xml ---
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <setting name="debug" value="true"/>
  <database host="localhost" port="5432"/>
</configuration>
--- End of config.xml ---
```

**Benefits of Raw Content Approach:**
- Preserves original formatting, indentation, and comments
- Maintains XML attributes and structure exactly as authored
- Allows AI to understand context from original formatting choices
- Eliminates parsing artifacts and potential data loss
- Better AI comprehension through contextual understanding

## Error Handling

The system handles various error scenarios:

- **Invalid File Type**: Only JSON, YAML, and XML files are accepted
- **File Size Limit**: Files larger than 1MB are rejected
- **Format Validation**: Files are validated for supported formats but content is preserved as-is for AI processing
- **Read Errors**: File reading failures are handled gracefully

## Testing

Sample files are provided in the `test/` directory:

- `test/sample-data.json` - User data example (JSON)
- `test/config-data.json` - Configuration data example (JSON)
- `test/sample-data.yml` - User data example (YAML)
- `test/config-data.xml` - Configuration data example (XML)
- `test/fileParserTest.js` - Test script for file parser utility

## Technical Implementation

### File Processing Flow

1. User selects files through hidden file input
2. Files are validated for supported format and size
3. File content is read using FileReader API
4. Raw content is preserved for optimal AI processing
5. Valid files are added to store with metadata
6. Files are displayed in UI with removal options
7. On message send, raw file content is included with format headers
8. Files are cleared from store after successful send

### State Structure

```javascript
{
  attachedFiles: [
    {
      id: 'filename-timestamp',
      name: 'config.yml',
      size: 1024,
      content: 'raw YAML content as string', // Raw content for all file types
      formatLabel: 'YAML File' // Display label for the file type
    },
    {
      id: 'filename2-timestamp',
      name: 'data.json',
      size: 2048,
      content: 'raw JSON content as string', // Raw content preserved
      formatLabel: 'JSON File'
    },
    {
      id: 'filename3-timestamp',
      name: 'config.xml',
      size: 1536,
      content: 'raw XML content as string', // Raw content preserved
      formatLabel: 'XML File'
    }
  ]
}
```

### Dependencies

The feature has minimal dependencies since it processes raw content:

- No additional parsing libraries required
- Uses native FileReader API for file reading
- Leverages built-in JavaScript string handling

## Future Enhancements

Potential improvements for future versions:

- Support for additional file formats (CSV, TOML)
- File content preview/summary
- Drag and drop file upload
- File compression for large datasets
- Persistent file attachments across sessions
- Schema validation for structured data
