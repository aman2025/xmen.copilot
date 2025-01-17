export const LOG_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_log',
      description: 'get the log of specific instance',
      parameters: {
        type: 'object',
        properties: {
          ip: {
            type: 'string',
            description: 'the ip of instance',
          },
        },
        required: ['ip'],
      },
    },
  },
]
