export const INSTANCE_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'create_instance_name',
      description:
        'Create a random instance name or ID, if the user query donot contain prefix, call ask_followup_question with options dfa- or eop-',
      parameters: {
        type: 'object',
        properties: {
          prefix: {
            type: 'string',
            description: 'Optional prefix for the instance name'
          },
          includeTimestamp: {
            type: 'boolean',
            description: 'Whether to include a timestamp in the name'
          }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'attempt_completion',
      description: 'Present the final result of a task to the user',
      parameters: {
        type: 'object',
        properties: {
          result: {
            type: 'string',
            description: 'The final result description of the task'
          }
        },
        required: ['result']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'remove_instance',
      description: 'Remove an instance with the specified ID',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'The ID of the instance to remove'
          }
        },
        required: ['id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'ask_followup_question',
      description: 'Ask the user a follow-up question with optional choices',
      parameters: {
        type: 'object',
        properties: {
          question: {
            type: 'string',
            description: 'The question to ask the user'
          },
          options: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Optional array of 2-5 options for the user to choose from'
          }
        },
        required: ['question']
      }
    }
  }
]
