export const DEMO_TOOLS = [
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
  {
    type: 'function',
    function: {
      name: 'get_flight_info',
      description: 'Returns information about the next flight between two cities. This includes the name of the airline, flight number and the date and time of the next flight',
      parameters: {
        type: 'object',
        properties: {
          originCity: {
            type: 'string',
            description: 'The name of the city where the flight originates',
          },
          destinationCity: {
            type: 'string',
            description: 'The flight destination city',
          },
        },
        required: ['originCity', 'destinationCity'],
      },
    },
  },
]
