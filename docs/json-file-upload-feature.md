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

- Handles parsing of JSON, YAML, and XML formats
- Provides format validation and error handling
- Supports async parsing for YAML files
- Includes utility functions for format checking

## File Format

Attached files are processed and included in the message context as follows:

### YAML Files (Raw Format Preserved)

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
```

### JSON Files (Formatted)

```
User message content

--- JSON File: filename.json ---
{
  "formatted": "json content",
  "with": "proper indentation"
}
--- End of filename.json ---
```

### XML Files (Converted to JSON)

```
User message content

--- XML File: data.xml ---
{
  "configuration": {
    "setting": {
      "@_name": "debug",
      "@_value": "true"
    }
  }
}
--- End of data.xml ---
```

## Error Handling

The system handles various error scenarios:

- **Invalid File Type**: Only JSON, YAML, and XML files are accepted
- **File Size Limit**: Files larger than 1MB are rejected
- **Format-Specific Errors**: Files with malformed content are rejected with specific error messages
  - Invalid JSON format
  - Invalid YAML syntax
  - Invalid XML structure
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
4. Content is parsed based on file extension (JSON/YAML/XML)
5. Valid files are added to store with metadata
6. Files are displayed in UI with removal options
7. On message send, file content is formatted and included
8. Files are cleared from store after successful send

### State Structure

```javascript
{
  attachedFiles: [
    {
      id: 'filename-timestamp',
      name: 'config.yml', // YAML file example
      size: 1024,
      content: 'raw YAML string', // For YAML files, raw content is preserved
      rawContent: 'original file content', // Always stored for reference
      formatLabel: 'YAML File' // Display label for the file type
    },
    {
      id: 'filename2-timestamp',
      name: 'data.json', // JSON file example
      size: 2048,
      content: {
        /* parsed JSON object */
      },
      rawContent: 'original JSON string',
      formatLabel: 'JSON File'
    }
  ]
}
```

### Dependencies

The feature requires the following packages:

- `yaml` - For YAML parsing (already available)
- `fast-xml-parser` - For XML parsing (needs to be installed)

Install the XML parser with:

```bash
npm install fast-xml-parser
```

## Future Enhancements

Potential improvements for future versions:

- Support for additional file formats (CSV, TOML)
- File content preview/summary
- Drag and drop file upload
- File compression for large datasets
- Persistent file attachments across sessions
- Schema validation for structured data
