## Message Flow Architecture Development Plan

### Overview

The message flow architecture will implement an advanced modular and object-oriented pattern to handle user messages, AI processing, and UI rendering. The core components will be:
1.Task Class: Manages message state and API calls
2.Controller Class: Coordinates between user input, task management, and UI updates
3.ContextManager: Handles context and conversation history
4.ChatView Component: Renders different types of messages in the UI

### Directory Structure

```
core/
├── task/
│   └── index.js         # Task class implementation
├── controller/
│   └── index.js         # Controller class implementation
├── context/
│   └── context-management/
│       └── ContextManager.js  # Context management implementation
components/
└── copilot/
    └── ChatView.jsx     # UI rendering component


### Component Details
1. Task Class
The Task class will be the core message and state management component responsible for:

- Initializing new conversation tasks
- Managing message state and API calls
- Making API requests and handling responses
- Processing tool uses
- Communicating with the UI through the Controller
```

class Task {
constructor(context, controller, options = {}) {
this.taskId = Date.now().toString();
this.controller = controller;
this.apiConversationHistory = [];
this.userMessages = [];
this.copilotMessages = [];
this.isStreaming = false;
this.currentStreamingContentIndex = 0;
this.options = options;
this.contextManager = new ContextManager();
}

// Initialize a new task with user input
async startTask(userInput, images = []) {
// Create initial task message
await this.addUserMessage(userInput, images);

    // Start task processing loop
    await this.processTask();

}

// Add a user message to the conversation
async addUserMessage(content, images = []) {
const message = {
id: `user-${Date.now()}`,
role: 'user',
content,
images,
createdAt: new Date().toISOString()
};

    this.userMessages.push(message);
    await this.updateConversationHistory();

    // Notify controller to update UI
    this.controller.postStateToWebview();

    return message;

}

// Add a copilot message to the conversation
async addCopilotMessage(type, content, metadata = {}) {
const message = {
id: `copilot-${Date.now()}`,
role: 'assistant',
type, // 'say', 'ask', 'tool', 'completion_result', etc.
content,
metadata,
createdAt: new Date().toISOString()
};

    this.copilotMessages.push(message);
    await this.updateConversationHistory();

    // Notify controller to update UI
    this.controller.postStateToWebview();

    return message;

}

// Process the current task
async processTask() {
try {
// Format messages for API
const formattedMessages = this.formatMessagesForAPI();

      // Start streaming indicator
      this.isStreaming = true;
      this.controller.postStateToWebview();

      // Make API request
      const response = await this.makeAPIRequest(formattedMessages);

      // Process response
      await this.processAPIResponse(response);

      // End streaming indicator
      this.isStreaming = false;
      this.controller.postStateToWebview();
    } catch (error) {
      await this.handleAPIError(error);
    }

}

// Format messages for API request
formatMessagesForAPI() {
// Combine user and copilot messages into format expected by API
// Include system prompt and context
return [...this.apiConversationHistory];
}

// Make API request
async makeAPIRequest(messages) {
// Implementation will depend on which AI provider is used
// This is a placeholder for the actual API call
return await fetch('/api/chat', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ messages })
}).then(res => res.json());
}

// Process API response
async processAPIResponse(response) {
// Parse response and determine message type
// Could be text, tool use, question, etc.
const { type, content, metadata } = this.parseResponse(response);

    // Add to copilot messages
    await this.addCopilotMessage(type, content, metadata);

    // Handle specific message types
    if (type === 'ask') {
      // Wait for user input
      await this.controller.askUser(content, metadata);
    } else if (type === 'tool') {
      // Handle tool use
      await this.handleToolUse(content, metadata);
    }

}

// Update conversation history
async updateConversationHistory() {
// Update the API conversation history based on user and copilot messages
this.apiConversationHistory = [
// System message
{ role: 'system', content: 'You are a helpful AI assistant.' },
// User and assistant messages
...this.userMessages.map(m => ({ role: 'user', content: m.content })),
...this.copilotMessages.map(m => ({ role: 'assistant', content: m.content }))
];

    // Save to disk or state
    await this.saveConversationHistory();

}

// Additional methods for handling specific scenarios
async handleToolUse(toolData, metadata) {
// Process tool use request
// Implement tool-specific logic
}

async handleAPIError(error) {
// Handle API errors
await this.addCopilotMessage('error', `An error occurred: ${error.message}`);
}

async saveConversationHistory() {
// Save conversation history to disk or state
}
}

export default Task;

```

2. Controller Class
The Controller acts as the central coordinator between user input, task management, and UI updates:

```

import Task from '../task';
import { vscode } from '../../utils/vscode';

class Controller {
constructor(context, outputChannel) {
this.context = context;
this.outputChannel = outputChannel;
this.task = null;
this.disposables = [];
}

// Initialize a new task
async initTask(userInput, images = []) {
// Clear any existing task
await this.clearTask();

    // Create a new task
    this.task = new Task(this.context, this);

    // Start the task with user input
    await this.task.startTask(userInput, images);

}

// Clear the current task
async clearTask() {
if (this.task) {
// Clean up task resources
this.task = null;
}

    // Update UI
    await this.postStateToWebview();

}

// Post state to webview
async postStateToWebview() {
if (!this.task) {
// No active task
await this.postMessage({
type: 'state',
userMessages: [],
copilotMessages: [],
isStreaming: false
});
return;
}

    // Post current task state
    await this.postMessage({
      type: 'state',
      userMessages: this.task.userMessages,
      copilotMessages: this.task.copilotMessages,
      isStreaming: this.task.isStreaming
    });

}

// Post a message to the webview
async postMessage(message) {
// Send message to webview
vscode.postMessage(message);
}

// Handle messages from webview
async handleWebviewMessage(message) {
switch (message.type) {
case 'newTask':
await this.initTask(message.text, message.images);
break;

      case 'userMessage':
        if (this.task) {
          await this.task.addUserMessage(message.text, message.images);
          await this.task.processTask();
        }
        break;

      case 'askResponse':
        if (this.task) {
          // Handle user response to a question
          await this.task.handleAskResponse(message.response, message.text, message.images);
        }
        break;

      case 'clearTask':
        await this.clearTask();
        break;

      // Add more message handlers as needed
    }

}

// Ask the user a question
async askUser(question, options = {}) {
// Post a message to the webview to ask the user
await this.postMessage({
type: 'ask',
question,
options
});

    // The response will come back via handleWebviewMessage

}

// Dispose of resources
dispose() {
this.clearTask();

    // Dispose of any other resources
    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }

}
}

export default Controller;

```

3.ContextManager
The ContextManager handles context and conversation history:
```

class ContextManager {
constructor() {
this.contextHistory = new Map();
this.contextUpdates = new Map();
}

// Initialize context history
async initializeContextHistory(taskDirectory) {
// Load context history from disk if it exists
this.contextHistory = await this.loadContextHistory(taskDirectory);
}

// Load context history from disk
async loadContextHistory(taskDirectory) {
try {
// Implementation to load context history from disk
return new Map();
} catch (error) {
console.error('Failed to load context history:', error);
return new Map();
}
}

// Save context history to disk
async saveContextHistory(taskDirectory) {
try {
// Implementation to save context history to disk
} catch (error) {
console.error('Failed to save context history:', error);
}
}

// Get updated context messages
async getUpdatedContextMessages(messages, deletedRange) {
// Apply context optimizations and truncation
return this.applyContextUpdates(messages, deletedRange);
}

// Apply context updates to messages
applyContextUpdates(messages, deletedRange) {
// Implementation to apply context updates
return messages;
}

// Truncate context history at a specific timestamp
async truncateContextHistory(timestamp, taskDirectory) {
// Implementation to truncate context history
await this.saveContextHistory(taskDirectory);
}
}

export default ContextManager;

```

4. ChatView Component
The ChatView component renders different types of messages in the UI:
```

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import ChatRow from './ChatRow';
import ChatInput from './ChatInput';

const ChatView = ({ isHidden }) => {
const { userMessages, copilotMessages, isStreaming } = useExtensionState();
const [inputValue, setInputValue] = useState('');
const [selectedImages, setSelectedImages] = useState([]);
const [textAreaDisabled, setTextAreaDisabled] = useState(false);
const virtuosoRef = useRef(null);
const [expandedRows, setExpandedRows] = useState({});

// Handle sending a message
const handleSendMessage = useCallback((text, images = []) => {
text = text.trim();
if (text || images.length > 0) {
// Send message to extension
vscode.postMessage({
type: 'userMessage',
text,
images
});

      // Clear input
      setInputValue('');
      setSelectedImages([]);
      setTextAreaDisabled(true);
    }

}, []);

// Render different message types
const renderMessage = useCallback((message) => {
switch (message.type) {
case 'say':
return <TextMessage message={message} />;
case 'ask':
return <QuestionMessage message={message} onRespond={handleSendMessage} />;
case 'tool':
return <ToolMessage message={message} />;
case 'completion_result':
return <CompletionResultMessage message={message} />;
default:
return <TextMessage message={message} />;
}
}, [handleSendMessage]);

// Scroll to bottom when new messages arrive
useEffect(() => {
if (virtuosoRef.current) {
virtuosoRef.current.scrollToIndex({
index: copilotMessages.length - 1,
behavior: 'smooth'
});
}
}, [copilotMessages.length]);

return (

<div className="chat-view">
<div className="messages-container">
<Virtuoso
ref={virtuosoRef}
data={copilotMessages}
itemContent={(index, message) => (
<ChatRow
key={message.id}
message={message}
isExpanded={expandedRows[message.id] || false}
onToggleExpand={() => {
setExpandedRows(prev => ({
...prev,
[message.id]: !prev[message.id]
}));
}}
isLast={index === copilotMessages.length - 1}
/>
)}
/>
</div>

      <ChatInput
        inputValue={inputValue}
        setInputValue={setInputValue}
        textAreaDisabled={textAreaDisabled}
        selectedImages={selectedImages}
        setSelectedImages={setSelectedImages}
        onSend={() => handleSendMessage(inputValue, selectedImages)}
        isStreaming={isStreaming}
      />
    </div>

);
};

export default ChatView;

```

### Message Flow Process
1. User Input Flow
- User types a message in ChatInput component
- ChatInput sends the message to the Controller via vscode.postMessage
- Controller receives the message and passes it to the Task class
- Task class adds the message to userMessages and updates the conversation history
- Task class initiates the API request process
```

2. API Processing Flow

- Task formats messages for the API
- Task makes the API request and sets streaming state to true
- Task processes the API response
- Based on response type, Task creates appropriate copilotMessage
- Task updates the conversation history

3. UI Update Flow

- Task notifies Controller to update the UI via postStateToWebview
- Controller sends the updated state to the webview
- ChatView component receives the updated state and renders the messages
- Different message types are rendered with appropriate styling and interactions

### Message Types and Styling

- The system will support various message types with different styling:
- Text Messages: Standard text responses
- Ask Messages: Questions requiring user input
- Tool Messages: Messages related to tool usage
- Completion Result Messages: Final results of a task

Example Input/Output Flow

### Example 1: Simple Text Response

User Input:
``Show me all instances`

Process Flow:

- User types "Show me all instances" in ChatInput
- Controller receives message and passes to Task
- Task adds to userMessages and makes API request
- API responds with a text response
- Task creates a 'say' type copilotMessage
- Controller updates UI
- ChatView renders the text message

UI Output:

```
User: Show me all instances
Copilot: Here are all the instances in your project:
- Instance 1: UserController
- Instance 2: ProductService
- Instance 3: DatabaseConnector
```

### Example 2: Tool Usage

```
"Create a new React component for a user profile"
```

Process Flow:

- User types request in ChatInput
- Controller passes to Task
- Task makes API request
- API responds with a tool use request
- Task creates a 'tool' type copilotMessage
- Controller updates UI with tool request
- User approves the tool use
- Task executes the tool and updates with result
- Controller updates UI with the result

UI Output:

````
User: Create a new React component for a user profile

Copilot: I'll create a new React component for a user profile. Here's what I'm planning to create:

[Tool Request]
File: src/components/UserProfile.jsx
Content:
```jsx
import React from 'react';
import './UserProfile.css';

const UserProfile = ({ user }) => {
  return (
    <div className="user-profile">
      <div className="user-profile-header">
        <img src={user.avatar} alt={user.name} className="user-avatar" />
        <h2>{user.name}</h2>
      </div>
      <div className="user-profile-details">
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.role}</p>
        <p><strong>Joined:</strong> {new Date(user.joinDate).toLocaleDateString()}</p>
      </div>
    </div>
  );
};

export default UserProfile;
````

[Approve] [Reject]
User: [Clicks Approve]
Copilot: I've created the UserProfile component at src/components/UserProfile.jsx. You can now import and use it in your application like this:

```
import UserProfile from './components/UserProfile';

// Then in your component:
<UserProfile user={userData} />
```
