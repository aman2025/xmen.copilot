'use client'

import React, { useEffect } from 'react'

const get_flight_info = ({ params, onComplete, registerActions }) => {
  const { originCity, destinationCity } = params || {}

  // Mock flight data - in a real application, this would come from an API
  const mockFlightData = {
    success: true,
    data: {
      airline: 'Delta',
      flight_number: 'DL123',
      flight_date: 'May 7th, 2024',
      flight_time: '10:00AM',
      origin: originCity,
      destination: destinationCity,
    },
  }

  const handleAccept = () => {
    onComplete(mockFlightData)
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
      <div className="space-y-2">
        <div>Searching for flights:</div>
        <div className="text-sm text-gray-600">From: {originCity}</div>
        <div className="text-sm text-gray-600">To: {destinationCity}</div>
      </div>
    </div>
  )
}

export default get_flight_info
