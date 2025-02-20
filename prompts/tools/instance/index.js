export const INSTANCE_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_services',
      description:
        'Retrieves service information from the application instance management system. Each service represents a distinct application type (e.g., dfa-crc, tomcat) that can have multiple running instances. Returns service details including id, serviceId, and serviceName.',
      parameters: {
        type: 'object',
        properties: {
          serviceName: {
            type: 'string',
            description:
              'Filter to get details of a specific service by its name (e.g., "dfa-crc" or "tomcat"). It need to be provided.'
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
              'Filter instances by service ID (e.g., 10001 for dfa-crc, 10002 for tomcat). Each service has unique instances associated with it. It need to be provided.'
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
      description: 'Start an instance when the instance is stopped',
      parameters: {
        type: 'object',
        properties: {
          instance_id: {
            type: 'string',
            description: 'The id of the instance to start'
          }
        },
        required: ['instance_id']
      }
    }
  }
]
