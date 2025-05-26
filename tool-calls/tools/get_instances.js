const get_instances = async (params = {}) => {
  const { serviceId } = params

  // Sample data
  const allInstances = [
    {
      id: '001',
      instanceId: '112',
      instanceName: 'dfa-crc@10.168.1.112',
      serviceId: '1001',
      serviceName: 'dfa-crc',
      ip: '10.168.1.112',
      port: 8080,
      instanceStatus: 'running',
      statusDesc: 'The instance is running'
    },
    {
      id: '002',
      instanceId: '129',
      instanceName: 'dfa-crc@10.168.1.129',
      serviceId: '1001', // Changed to match the first instance for filtering
      serviceName: 'dfa-crc',
      ip: '10.168.1.129',
      port: 8089,
      instanceStatus: 'running',
      statusDesc: 'The instance is running'
    }
  ]

  // If serviceId is provided, filter the results
  if (serviceId !== undefined && serviceId !== null) {
    // Convert serviceId to string for comparison (it might come as an integer from the API)
    const serviceIdStr = String(serviceId)
    console.log(`Filtering instances by serviceId: ${serviceIdStr}`)
    return allInstances.filter((instance) => instance.serviceId === serviceIdStr)
  }

  // Otherwise return all instances
  return allInstances
}

export default get_instances
