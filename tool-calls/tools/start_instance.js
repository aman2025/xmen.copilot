const start_instance = async ({ instanceId }) => {
  try {
    const response = await fetch('/api/proxy/startInstance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ instanceId })
    })

    const data = await response.json()
    return data.retCode === 0 ? data.result : data.error
  } catch (error) {
    console.error('Failed to start instance:', error)
    return 'Failed to start instance:'
  }
}

export default start_instance
