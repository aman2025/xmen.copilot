/**
 * Fetches services data from the API
 * @param {Object} params - The request parameters
 * @param {string} params.serviceName - Required service name to fetch
 * @returns {Promise<any>} The services data or error message
 */
const get_services = async ({ serviceName }) => {
  // Check for empty or null serviceName
  if (!serviceName) {
    return 'serviceName is required'
  }

  try {
    const response = await fetch(
      `/api/proxy/services?serviceName=${encodeURIComponent(serviceName)}`
    )
    const data = await response.json()

    // Check for specific error response
    if (data.retCode === -1) {
      return 'Service not found'
    }

    return data.result
  } catch (error) {
    // Handle any fetch or parsing errors
    console.error('Error fetching service:', error)
    throw error
  }
}

export default get_services
