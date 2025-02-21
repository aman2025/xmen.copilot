export const INSTANCE_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_services',
      description:
        'Retrieves service information from the application instance management system. Each service represents a distinct application type that can have multiple running instances. Returns service details including id, serviceId, and serviceName.',
      parameters: {
        type: 'object',
        properties: {
          serviceName: {
            type: 'string',
            description: 'Filter to get details of a specific service by its name.'
          }
        },
        required: ['serviceName']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_instances',
      description:
        'Get all instances provides a list of all instances contain fields: id, instanceId, instanceName, serviceName, ip, port, instanceStatus, statusDesc',
      parameters: {
        type: 'object',
        properties: {
          serviceId: {
            type: 'integer',
            description:
              'Filter instances by service ID. Each service has unique instances associated with it.'
          }
        },
        required: ['serviceId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'start_instance',
      description: 'Start an instance when the instance is stopped or waiting',
      parameters: {
        type: 'object',
        properties: {
          instanceId: {
            type: 'string',
            description: 'The id of the instance to start'
          }
        },
        required: ['instanceId']
      }
    }
  }
]
