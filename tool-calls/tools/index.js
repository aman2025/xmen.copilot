import getInstances from './instance/get-instances'
import startInstance from './instance/start-instance'
import getServices from './service/get-services'

// export a array with all the tool calls
export const toolCalls = [getInstances, startInstance, getServices]
