const get_services = async (params = {}) => {
  const { serviceName } = params

  console.log(`get_services called with params:`, params)

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
    console.log(`Filtering services by serviceName: ${serviceName}`)
    const filteredServices = allServices.filter((service) =>
      service.serviceName.toLowerCase().includes(serviceName.toLowerCase())
    )
    console.log(`Found ${filteredServices.length} services matching "${serviceName}"`)
    return filteredServices
  }

  // Otherwise return all services
  console.log(`Returning all ${allServices.length} services`)
  return allServices
}

export default get_services
