# JSON File Upload Feature

## Overview

The ChatInput component now supports uploading JSON files as context for AI conversations. Users can attach multiple JSON files to provide structured data context to the AI assistant.

## Features

### File Upload Support
- **File Types**: Only JSON files (.json extension)
- **Multiple Files**: Support for uploading multiple JSON files simultaneously
- **File Size Limit**: Maximum 1MB per file
- **Validation**: Automatic JSON format validation

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
2. Select one or more JSON files from your computer
3. Files will appear as tags above the input field
4. Type your message and send - the JSON content will be included as context
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
- Added file input handling with validation
- Implemented UI for file attachment and management
- Added error handling and user feedback

## File Format

Attached JSON files are processed and included in the message context as follows:

```
User message content

--- JSON File: filename.json ---
{
  "formatted": "json content",
  "with": "proper indentation"
}
--- End of filename.json ---
```

## Error Handling

The system handles various error scenarios:
- **Invalid File Type**: Only .json files are accepted
- **File Size Limit**: Files larger than 1MB are rejected
- **Invalid JSON**: Files with malformed JSON are rejected with specific error messages
- **Read Errors**: File reading failures are handled gracefully

## Testing

Sample JSON files are provided in the `test/` directory:
- `test/sample-data.json` - User data example
- `test/config-data.json` - Configuration data example

## Technical Implementation

### File Processing Flow
1. User selects files through hidden file input
2. Files are validated for type and size
3. File content is read using FileReader API
4. JSON content is parsed and validated
5. Valid files are added to store with metadata
6. Files are displayed in UI with removal options
7. On message send, file content is formatted and included
8. Files are cleared from store after successful send

### State Structure
```javascript
{
  attachedFiles: [
    {
      id: "filename-timestamp",
      name: "filename.json",
      size: 1024,
      content: { /* parsed JSON object */ }
    }
  ]
}
```

## Future Enhancements

Potential improvements for future versions:
- Support for additional file formats (CSV, XML, YAML)
- File content preview/summary
- Drag and drop file upload
- File compression for large datasets
- Persistent file attachments across sessions
