export const INSTANCE_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_instances',
      description:
        'Get all instances provides a list of all instances contain fields: id, instanceId, instanceName, serviceName, ip, port, instanceStatus, statusDesc',
      parameters: {
        type: 'object',
        properties: {
          instance_id: {
            type: 'string',
            description: 'The id of the instance to get',
          }
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'start_instance',
      description: 'Start an instance when the instance is stopped',
      parameters: {
        type: 'object',
        properties: {
          instance_id: {
            type: 'string',
            description: 'The id of the instance to start',
          }
        },
        required: ['instance_id'],
      },
    },
  },
]
