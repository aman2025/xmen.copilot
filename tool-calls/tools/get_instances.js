const get_instances = async () => {
  const data = [
    {
      id: '001',
      instanceId: '112',
      instanceName: 'dfa-crc@10.168.1.112',
      serviceId: '001',
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
      serviceId: '001',
      serviceName: 'dfa-crc',
      ip: '10.168.1.129',
      port: 8089,
      instanceStatus: 'running',
      statusDesc: 'The instance is running'
    }
  ]
  return data
}

export default get_instances
