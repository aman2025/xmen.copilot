export const VERIFICATION_CASES = [
  {
    userQuery: 'Show me all nodes',
    context: {
      previousState: null,
      requiredContext: [],
      expectedFlow: ['get_nodes']
    },
    expectedFunction: {
      name: 'get_nodes',
      arguments: {}
    },
    isCorrect: true,
    error: null,
    reasoning: 'User explicitly asks for all nodes, no parameters needed'
  },
  {
    userQuery: 'Get all agents for ip 10.168.0.1',
    context: {
      previousState: {
        nodeInfo: {
          ip: '10.168.0.1'
        }
      },
      requiredContext: ['nodeInfo'],
      expectedFlow: ['get_nodes', 'get_node_agent']
    },
    expectedFunction: {
      name: 'get_node_agent',
      arguments: {
        ip: '10.168.0.1'
      }
    },
    isCorrect: true,
    error: null,
    reasoning: 'valid ip from previous get_nodes call'
  }
]
