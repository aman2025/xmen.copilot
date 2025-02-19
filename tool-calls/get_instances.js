const get_instances = async () => {
  const response = await fetch('/api/proxy/instances')
  const data = await response.json()
  return {
    content: 'Get instances success, using canvas or svg to render the instances',
    toolResult: data.instances
  }
}

export default get_instances
