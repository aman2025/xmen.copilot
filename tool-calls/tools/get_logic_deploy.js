const get_logic_deploy = async () => {
  const response = await fetch('/api/proxy/index/logicDeployInfo')
  const data = await response.json()
  return {
    content: 'Get logical deploy info success, using canvas or svg to render the services',
    toolResult: data.services
  }
}

export default get_logic_deploy
