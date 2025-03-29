export const INSTANCE_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'create_instance_name',
      description: 'Create a random instance name or ID',
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
  }
]
