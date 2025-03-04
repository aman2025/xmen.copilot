'use client'

import React, { useEffect, useState } from 'react'

const GetInstances = ({ onComplete, registerActions, sendMessage, toolCallId }) => {
  const [instanceData, setInstanceData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchInstanceData = async () => {
      try {
        const response = await fetch('/api/proxy/instances')
        const data = await response.json()
        setInstanceData(data.instances)
        console.log('instanceData', data.instances)
      } catch (error) {
        console.error('Error fetching instance data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInstanceData()
  }, [])

  const handleComplete = () => {
    // Fix typo in 'result' and ensure we're using current instanceData
    const resultMessage = {
      content: 'Get instances success',
      toolResult: instanceData
    }
    sendMessage({
      content: JSON.stringify(resultMessage),
      role: 'tool',
      toolCallId: toolCallId
    })
    onComplete()
  }

  // Update the registerActions effect to include instanceData in dependencies
  useEffect(() => {
    if (registerActions) {
      registerActions({ handleComplete })
    }
  }, [registerActions, instanceData])

  if (isLoading) {
    return <div>Loading instance data...</div>
  }

  if (!instanceData) return <div>No instance data available</div>

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-4">
        <div>Getting all instances: </div>
        {isLoading ? (
          <div>Loading instance data...</div>
        ) : instanceData ? (
          <div className="rounded-md bg-gray-50 p-4 dark:bg-gray-800">
            <h3 className="mb-2 font-medium">Instance Data:</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                      Instance Name
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                      Service
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                      IP
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                      Port
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {instanceData.map((instance) => (
                    <tr key={instance.instanceId}>
                      <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                        {instance.instanceName}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                        {instance.serviceName}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                        {instance.ip}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                        {instance.port}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            instance.instanceStatus === 10
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}
                        >
                          {instance.statusDesc}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-red-500">Failed to load instance data</div>
        )}
      </div>
    </div>
  )
}

export default GetInstances
