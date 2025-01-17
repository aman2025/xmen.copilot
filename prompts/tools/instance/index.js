export const INSTANCE_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description:
        'Get the current weather in a given location. This tool provides real-time weather information including temperature and conditions for any specified city. It should be used when users ask about current weather conditions in a specific location.',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'The city and state, e.g. San Francisco, CA',
          },
          unit: {
            type: 'string',
            enum: ['celsius', 'fahrenheit'],
            description: 'The unit of temperature to return',
          },
        },
        required: ['location'],
      },
    },
  },
]
