'use client'

import React, { forwardRef, useImperativeHandle } from 'react'

const get_weather = forwardRef(({ params, onComplete }, ref) => {
  const { location } = params || {}

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    handleAccept: () => {
      const weatherData = { success: true, data: { temperature: '22°C' } }
      onComplete(weatherData)
    },
    handleReject: () => {
      onComplete(false)
    },
  }))

  return (
    <div className="flex h-full flex-col">
      <div>Getting weather for location: {location}</div>
    </div>
  )
})

get_weather.displayName = 'get_weather'

export default get_weather
