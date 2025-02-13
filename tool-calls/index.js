// Global tool definitions
export const TOOL_CALLS = {
  get_weather: (args) => ({
    tool: 'get_weather',
    params: args,
  }),
}

export const get_weather = (args) => {
  return TOOL_CALLS.get_weather(args)
}
