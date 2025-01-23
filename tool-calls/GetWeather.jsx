'use client'

const GetWeather = ({ params, onComplete }) => {
  const { location } = params || {}

  return (
    <div className="flex h-full flex-col">
      <div>Getting weather for location: {location}</div>
      <button
        onClick={() => onComplete({ success: true, data: { temperature: '22°C' } })}
        className="mt-4 rounded bg-blue-500 px-4 py-2 text-white"
      >
        Complete
      </button>
    </div>
  )
}

export default GetWeather
