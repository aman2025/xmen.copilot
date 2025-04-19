## Message Flow Architecture

1. User Input

- User types message in ChatInput
- Message sent to Task class

2. Task Processing

- Task class receives message
- Initializes conversation if new task
- Manages message state and API calls

3. Task -> API Integration

- Formats messages for API
- Handles Ai responses
- Processes tool uses

4. Task -> WebView Communication

   - Updates message state
   - Sends state updates

5. WebView -> UI Rendering

- ChatView receives state updates
- Processes messages for display
- Renders different message types

## Core Directory Structure
Note: the core directory is not exist.
The key code:

1. core/task/index.js
   - Core message and state management,
   - initializes task, Make API request and response
   - Task lifecycle：Initialize new task -> Post initial state to webview -> Create initial task message -> Start task loop

```
class Task{}
```

2. core/controller/index.js
   The controller handles different types of messages through a message handler system
   The controller acts as the central coordinator between user input, task management, and UI updates

```
class Controller{}
```

3. core/context-management/ContextManager.js
   Handles context and history

4. components/copilot/Chatview.jsx
   rendering different types of copilotMessages(e.g. say, ask, tool, completion_result)

5. app/api/chat/[chatId]/messages/route.js
   Ai api endpoint

6. utils/ai-sdk/mistral.js
   use Ai api handle user message, system prompt, tools definition ,format response, update message state

7. prompts/index.js
   system prompt and tools definition

8. store/
   -copilotMessages: store specific copilot message display in the UI

   - Example copilotMessages

   ```
    const copilotMessages = [
    // 1. User's request appears
    {
        ts: Date.now(),
        type: "ask",
        ask: "followup",
        text: "show me all instances",
    },

    // 2. API request started (shows loading indicator)
    {
        ts: Date.now() + 100,
        type: "say",
        say: "api_req_started",
        text: JSON.stringify({
            request: "<task>\nshow me all instances\n</task>"
        })
    },

    // 3. Assistant's reasoning
    {
        ts: Date.now() + 200,
        type: "say",
        say: "reasoning",
        text: "I'll show all instances from tool get_instances. ",
    },

    // 4. Tool use (shows as a tool use card)
    {
        ts: Date.now() + 300,
        type: "say",
        say: "tool",
        text: JSON.stringify({
            tool: "get_instance",
            content: `{instanceName: 'dfa-crc', ip: '192.168.1.1', port: 8080}`
        })
    },

    // 5. Completion message (shows as final response)
    {
        ts: Date.now() + 400,
        type: "say",
        say: "completion_result",
        text: "I have shown all instances. the first one is dfa-crc. "
    }
   ]
   ```

   - userMessage: store user message and Ai response
   - Example userMessage

   ```
   const userMessages = [
        {
            role: "user",
            content: [
                {
                    type: "text",
                    text: "show me all instances"
                },
                {
                    type: "text",
                    text: "<environment_details>user name: ZR</environment_details>"
                }
            ]
        },
        {
            role: "assistant",
            content: [
                {
                    type: "text",
                    text: "I'll show all instances from tool get_instances"
                }
            ]
        }
    ]
   ```
