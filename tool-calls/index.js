// Global tool definitions
export const TOOL_CALLS = {
  get_weather: (location) => ({
    tool: 'GetWeather',
    params: { location },
  }),
}

export const get_weather = (location) => {
  return TOOL_CALLS.get_weather(location)
}
