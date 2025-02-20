/**
 * Fetches services data from the API
 * @param {Object} params - The request parameters
 * @param {string} params.serviceName - Required service name to fetch
 * @returns {Promise<any>} The services data
 */
const get_services = async ({ serviceName }) => {
  if (!serviceName) {
    throw new Error('serviceName is required')
  }

  const response = await fetch('/api/proxy/services', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    params: { serviceName } // Changed from body to params since it's a GET request
  })
  const data = await response.json()
  return data.result
}

export default get_services
