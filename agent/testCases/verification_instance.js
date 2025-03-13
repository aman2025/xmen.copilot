export const VERIFICATION_INSTANCE_TEST_CASES = [
  {
    userQuery: 'Show me the status of dfa-crc service',
    context: {
      previousState: null,
      requiredContext: [],
      expectedFlow: ['get_services']
    },
    expectedFunction: {
      name: 'get_services',
      arguments: {
        serviceName: 'dfa-crc'
      }
    },
    validation: {
      intentType: 'SERVICE_STATUS_CHECK',
      requiredParameters: ['serviceName'],
      parameterConstraints: {
        serviceName: {
          type: 'string',
          pattern: '^[a-zA-Z0-9-_]+$',
          examples: ['DFA-MCF', 'DFA-GATEWAY', 'DFA-CRC']
        }
      }
    },
    isCorrect: true,
    error: null,
    reasoning: 'User explicitly asks for service status and provides valid service name'
  },
  {
    userQuery: "What's the current status of DFA-GATEWAY?",
    context: {
      previousState: null,
      requiredContext: [],
      expectedFlow: ['get_services']
    },
    expectedFunction: {
      name: 'get_services',
      arguments: {
        serviceName: 'DFA-GATEWAY'
      }
    },
    validation: {
      intentType: 'SERVICE_STATUS_CHECK',
      requiredParameters: ['serviceName'],
      parameterConstraints: {
        serviceName: {
          type: 'string',
          pattern: '^[a-zA-Z0-9-_]+$'
        }
      }
    },
    isCorrect: true,
    error: null,
    reasoning: 'Query clearly indicates service status check with valid service name'
  },
  {
    userQuery: 'Check tomcat service',
    context: {
      previousState: null,
      requiredContext: [],
      expectedFlow: ['get_services']
    },
    expectedFunction: {
      name: 'get_services',
      arguments: {
        serviceName: 'tomcat'
      }
    },
    validation: {
      intentType: 'SERVICE_STATUS_CHECK',
      requiredParameters: ['serviceName'],
      parameterConstraints: {
        serviceName: {
          type: 'string',
          pattern: '^[a-zA-Z0-9-_]+$'
        }
      }
    },
    isCorrect: true,
    error: null,
    reasoning: 'Simple service check request with valid service name'
  },
  {
    userQuery: 'Get instances for service ID 10002',
    context: {
      previousState: {
        serviceInfo: {
          id: 2,
          serviceId: 10002,
          serviceName: 'DFA-MCF'
        }
      },
      requiredContext: ['serviceInfo'],
      expectedFlow: ['get_services', 'get_instances']
    },
    expectedFunction: {
      name: 'get_instances',
      arguments: {
        serviceId: 10002
      }
    },
    validation: {
      intentType: 'INSTANCE_LIST_REQUEST',
      requiredParameters: ['serviceId'],
      parameterConstraints: {
        serviceId: {
          type: 'integer',
          minimum: 1
        }
      }
    },
    isCorrect: true,
    error: null,
    reasoning: 'Valid instance request with proper service context and serviceId'
  },
  {
    userQuery: 'List all instances of tomcat service',
    context: {
      previousState: {
        serviceInfo: {
          id: 3,
          serviceId: 10003,
          serviceName: 'tomcat'
        }
      },
      requiredContext: ['serviceInfo'],
      expectedFlow: ['get_services', 'get_instances']
    },
    expectedFunction: {
      name: 'get_instances',
      arguments: {
        serviceId: 10003
      }
    },
    validation: {
      intentType: 'INSTANCE_LIST_REQUEST',
      requiredParameters: ['serviceId'],
      parameterConstraints: {
        serviceId: {
          type: 'integer',
          minimum: 1
        }
      }
    },
    isCorrect: true,
    error: null,
    reasoning: 'Natural language request for instances with proper context'
  },
  {
    userQuery: 'Start instance 123 of DFA-MCF service',
    context: {
      previousState: {
        serviceInfo: {
          id: 1,
          serviceId: 10001,
          serviceName: 'DFA-MCF'
        },
        instanceInfo: {
          id: 123,
          instanceId: '123',
          serviceName: 'DFA-MCF',
          status: 'stopped'
        }
      },
      requiredContext: ['serviceInfo', 'instanceInfo'],
      expectedFlow: ['get_services', 'get_instances', 'start_instance']
    },
    expectedFunction: {
      name: 'start_instance',
      arguments: {
        instanceId: '123'
      }
    },
    validation: {
      intentType: 'INSTANCE_START_REQUEST',
      requiredParameters: ['instanceId'],
      parameterConstraints: {
        instanceId: {
          type: 'string',
          pattern: '^[0-9]+$'
        }
      }
    },
    isCorrect: true,
    error: null,
    reasoning: 'Complete context available with valid instance ID for start operation'
  },
  {
    userQuery: 'Show instances',
    context: {
      previousState: null,
      requiredContext: ['serviceInfo'],
      expectedFlow: ['get_services', 'get_instances']
    },
    expectedFunction: {
      name: 'get_instances',
      arguments: {}
    },
    validation: {
      intentType: 'INSTANCE_LIST_REQUEST',
      requiredParameters: ['serviceId'],
      parameterConstraints: {
        serviceId: {
          type: 'integer',
          minimum: 1
        }
      }
    },
    isCorrect: false,
    error: 'Missing service context - must specify or get service information first',
    reasoning: 'Attempt to list instances without required service context'
  },
  {
    userQuery: 'Start instance abc',
    context: {
      previousState: null,
      requiredContext: ['serviceInfo', 'instanceInfo'],
      expectedFlow: ['get_services', 'get_instances', 'start_instance']
    },
    expectedFunction: {
      name: 'start_instance',
      arguments: {
        instanceId: 'abc'
      }
    },
    validation: {
      intentType: 'INSTANCE_START_REQUEST',
      requiredParameters: ['instanceId'],
      parameterConstraints: {
        instanceId: {
          type: 'string',
          pattern: '^[0-9]+$'
        }
      }
    },
    isCorrect: false,
    error: 'Invalid instance ID format and missing required context',
    reasoning: 'Instance ID must be numeric and service/instance context is required'
  },
  {
    userQuery: 'Get status of service @#$%',
    context: {
      previousState: null,
      requiredContext: [],
      expectedFlow: ['get_services']
    },
    expectedFunction: {
      name: 'get_services',
      arguments: {
        serviceName: '@#$%'
      }
    },
    validation: {
      intentType: 'SERVICE_STATUS_CHECK',
      requiredParameters: ['serviceName'],
      parameterConstraints: {
        serviceName: {
          type: 'string',
          pattern: '^[a-zA-Z0-9-_]+$'
        }
      }
    },
    isCorrect: false,
    error: 'Invalid service name format',
    reasoning: 'Service name contains invalid characters, must match pattern ^[a-zA-Z0-9-_]+$'
  },
  {
    userQuery: 'Is DFA-MCF service running?',
    context: {
      previousState: null,
      requiredContext: [],
      expectedFlow: ['get_services']
    },
    expectedFunction: {
      name: 'get_services',
      arguments: {
        serviceName: 'DFA-MCF'
      }
    },
    validation: {
      intentType: 'SERVICE_STATUS_CHECK',
      requiredParameters: ['serviceName'],
      parameterConstraints: {
        serviceName: {
          type: 'string',
          pattern: '^[a-zA-Z0-9-_]+$'
        }
      }
    },
    isCorrect: true,
    error: null,
    reasoning: 'Valid service name with hyphen, clear status check intent'
  },
  {
    userQuery: 'Tell me about DFA-CRC service',
    context: {
      previousState: null,
      requiredContext: [],
      expectedFlow: ['get_services']
    },
    expectedFunction: {
      name: 'get_services',
      arguments: {
        serviceName: 'DFA-CRC'
      }
    },
    validation: {
      intentType: 'SERVICE_STATUS_CHECK',
      requiredParameters: ['serviceName'],
      parameterConstraints: {
        serviceName: {
          type: 'string',
          pattern: '^[a-zA-Z0-9-_]+$'
        }
      }
    },
    isCorrect: true,
    error: null,
    reasoning: 'Valid service name with underscore, implicit status check'
  },
  {
    userQuery: 'Show all instances of service ID 10004',
    context: {
      previousState: {
        serviceInfo: {
          id: 4,
          serviceId: 10004,
          serviceName: 'DFA-CRC'
        }
      },
      requiredContext: ['serviceInfo'],
      expectedFlow: ['get_services', 'get_instances']
    },
    expectedFunction: {
      name: 'get_instances',
      arguments: {
        serviceId: 10004
      }
    },
    validation: {
      intentType: 'INSTANCE_LIST_REQUEST',
      requiredParameters: ['serviceId'],
      parameterConstraints: {
        serviceId: {
          type: 'integer',
          minimum: 1
        }
      }
    },
    isCorrect: true,
    error: null,
    reasoning: 'Valid instance list request with proper service context'
  },
  {
    userQuery: 'Start the stopped instance 789',
    context: {
      previousState: {
        serviceInfo: {
          id: 5,
          serviceId: 10005,
          serviceName: 'DFA-CRC'
        },
        instanceInfo: {
          id: 789,
          instanceId: '789',
          serviceName: 'DFA-CRC',
          status: 'stopped'
        }
      },
      requiredContext: ['serviceInfo', 'instanceInfo'],
      expectedFlow: ['get_services', 'get_instances', 'start_instance']
    },
    expectedFunction: {
      name: 'start_instance',
      arguments: {
        instanceId: '789'
      }
    },
    validation: {
      intentType: 'INSTANCE_START_REQUEST',
      requiredParameters: ['instanceId'],
      parameterConstraints: {
        instanceId: {
          type: 'string',
          pattern: '^[0-9]+$'
        }
      }
    },
    isCorrect: true,
    error: null,
    reasoning: 'Valid start request with complete context and stopped instance'
  },
  {
    userQuery: 'Get instances for DFA-GATEWAY',
    context: {
      previousState: null,
      requiredContext: ['serviceInfo'],
      expectedFlow: ['get_services', 'get_instances']
    },
    expectedFunction: {
      name: 'get_instances',
      arguments: {
        serviceId: null
      }
    },
    validation: {
      intentType: 'INSTANCE_LIST_REQUEST',
      requiredParameters: ['serviceId'],
      parameterConstraints: {
        serviceId: {
          type: 'integer',
          minimum: 1
        }
      }
    },
    isCorrect: false,
    error: 'Must get service information first to obtain serviceId',
    reasoning: 'Missing service context - need to call get_services first'
  },
  {
    userQuery: 'Start instance 456 of unknown service',
    context: {
      previousState: null,
      requiredContext: ['serviceInfo', 'instanceInfo'],
      expectedFlow: ['get_services', 'get_instances', 'start_instance']
    },
    expectedFunction: {
      name: 'start_instance',
      arguments: {
        instanceId: '456'
      }
    },
    validation: {
      intentType: 'INSTANCE_START_REQUEST',
      requiredParameters: ['instanceId'],
      parameterConstraints: {
        instanceId: {
          type: 'string',
          pattern: '^[0-9]+$'
        }
      }
    },
    isCorrect: false,
    error: 'Missing service and instance context',
    reasoning: 'Must first get service info and verify instance exists'
  },
  {
    userQuery: 'Check status of service 12345',
    context: {
      previousState: null,
      requiredContext: [],
      expectedFlow: ['get_services']
    },
    expectedFunction: {
      name: 'get_services',
      arguments: {
        serviceName: '12345'
      }
    },
    validation: {
      intentType: 'SERVICE_STATUS_CHECK',
      requiredParameters: ['serviceName'],
      parameterConstraints: {
        serviceName: {
          type: 'string',
          pattern: '^[a-zA-Z0-9-_]+$'
        }
      }
    },
    isCorrect: false,
    error: 'Service name should not be purely numeric',
    reasoning: 'While the format is valid, service names typically include alphabetic characters'
  },
  {
    userQuery: 'List running instances',
    context: {
      previousState: null,
      requiredContext: ['serviceInfo'],
      expectedFlow: ['get_services', 'get_instances']
    },
    expectedFunction: {
      name: 'get_instances',
      arguments: {}
    },
    validation: {
      intentType: 'INSTANCE_LIST_REQUEST',
      requiredParameters: ['serviceId'],
      parameterConstraints: {
        serviceId: {
          type: 'integer',
          minimum: 1
        }
      }
    },
    isCorrect: false,
    error: 'Ambiguous request - missing service context',
    reasoning: "Need to specify which service's instances to list"
  }
]
