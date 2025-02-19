const get_instances = async () => {
  const response = await fetch('/api/proxy/instances')
  const data = await response.json()
  return {
    content: 'Get instances success',
    toolResult: data.instances
  }
}

export default get_instances
