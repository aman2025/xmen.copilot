const get_services = async (params = {}) => {
  const { serviceName } = params

  // Sample data
  const allServices = [
    {
      id: '10001',
      serviceId: '001',
      serviceName: 'dfa-crc',
      description: 'Handles all order processing workflows.'
    }
  ]

  // If serviceName is provided, filter the results
  if (serviceName) {
    return allServices.filter((service) =>
      service.serviceName.toLowerCase().includes(serviceName.toLowerCase())
    )
  }

  // Otherwise return all services
  return allServices
}

export default get_services
