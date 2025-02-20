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

  const response = await fetch(`/api/proxy/services?serviceName=${encodeURIComponent(serviceName)}`)
  const data = await response.json()
  return data.result
}

export default get_services
