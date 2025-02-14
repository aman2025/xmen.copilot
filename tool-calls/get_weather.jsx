'use client'

import React, { useEffect } from 'react'

const get_weather = ({ params, onComplete, registerActions }) => {
  const { location } = params || {}

  const handleAccept = () => {
    const weatherData = { success: true, data: { temperature: '22°C' } }
    onComplete(weatherData)
  }

  const handleReject = () => {
    onComplete(false)
  }

  // Register the action callbacks when the component mounts
  useEffect(() => {
    if (registerActions) {
      registerActions({ handleAccept, handleReject })
    }
  }, [registerActions])

  return (
    <div className="flex h-full flex-col">
      <div>Getting weather for location: {location}</div>
    </div>
  )
}

export default get_weather
