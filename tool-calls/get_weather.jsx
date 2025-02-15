'use client'

import React, { useEffect, useState } from 'react'

const get_weather = ({ params, onComplete, registerActions }) => {
  const { location } = params || {}
  const [instanceData, setInstanceData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch instance data from the other Next.js server
  useEffect(() => {
    const fetchInstanceData = async () => {
      try {
        const response = await fetch('/api/proxy/instances')
        const data = await response.json()
        console.log(data)
        setInstanceData(data)
      } catch (error) {
        console.error('Error fetching instance data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInstanceData()
  }, [])

  const handleAccept = () => {
    // Include instance data in the weather response if available
    const weatherData = {
      success: true,
      data: {
        temperature: '22°C',
        location,
        instance: instanceData,
      },
    }
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
      <div className="space-y-4">
        <div>Getting weather for location: {location}</div>
        {isLoading ? (
          <div>Loading instance data...</div>
        ) : instanceData ? (
          <div className="rounded-md bg-gray-50 p-4 dark:bg-gray-800">
            <h3 className="mb-2 font-medium">Instance Data:</h3>
            <pre className="overflow-auto text-sm">
              {JSON.stringify(instanceData, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="text-red-500">Failed to load instance data</div>
        )}
      </div>
    </div>
  )
}

export default get_weather
