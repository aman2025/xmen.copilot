/**
 * Fetches instances data from the API
 * @param {string} [serviceId] - Optional service ID to filter instances
 * @returns {Promise<any>} The instances data
 */
const getInstances = async ({ serviceId }) => {
  const url = serviceId
    ? `/api/proxy/instances?serviceId=${encodeURIComponent(serviceId)}`
    : '/api/proxy/instances'

  const response = await fetch(url)
  const data = await response.json()
  return data
}

export default getInstances
