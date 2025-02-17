'use client'

import React, { useState } from 'react'

const get_instances = ({ params, onComplete, registerActions }) => {
  const [instanceData, setInstanceData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  // Register actions for manual interaction
  React.useEffect(() => {
    registerActions({
      handleAccept: async () => {
        setIsLoading(true)
        try {
          const response = await fetch('/api/proxy/instances')
          const data = await response.json()
          onComplete({
            success: true,
            data: {
              result: data.instances
            }
          })
        } catch (error) {
          console.error('Error fetching instance data:', error)
          onComplete({
            success: false,
            error: 'Failed to fetch instance data'
          })
        }
        setIsLoading(false)
      },
      handleReject: () => {
        onComplete({
          success: false,
          error: 'User cancelled the operation'
        })
      }
    })
  }, [onComplete, registerActions])

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-4">
        {isLoading ? (
          <div>Loading instance data...</div>
        ) : (
          <div className="rounded-md bg-gray-50 p-4 dark:bg-gray-800">
            Click Accept to fetch instance data
          </div>
        )}
      </div>
    </div>
  )
}

export default get_instances
