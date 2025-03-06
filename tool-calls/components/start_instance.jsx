'use client'

import React, { useEffect, useState } from 'react'

const start_instance = ({ params, onComplete, registerActions, sendMessage, toolCallId }) => {
  const { instanceId } = params || {}
  const [loading, setLoading] = useState(false)
  const [resultMessage, setResultMessage] = useState(null)

  // Separate method for handling the instance start logic
  const startInstance = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/proxy/startInstance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ instanceId })
      })

      const data = await response.json()
      const result = data.retCode === 0 ? data.result : data.error

      // Format the success message
      const responseMessage = {
        success: data.retCode === 0,
        data: { instanceName: result.instanceName }
      }

      setResultMessage(responseMessage)
      return responseMessage
    } catch (error) {
      console.error('Failed to start instance:', error)
      const errorMessage = { success: false, error: 'Failed to start instance' }
      setResultMessage(errorMessage)
      return errorMessage
    } finally {
      setLoading(false)
    }
  }

  // Simplified handleAccept to only handle messaging and completion
  const handleAccept = async () => {
    const response = await startInstance()
    sendMessage({
      content: JSON.stringify(response),
      role: 'tool',
      toolCallId: toolCallId
    })
    onComplete()
  }

  const handleReject = () => {
    onComplete(false)
  }

  // Register actions and trigger startInstance on mount
  useEffect(() => {
    if (registerActions) {
      registerActions({ handleAccept, handleReject })
    }
    startInstance() // Start the instance when component mounts
  }, [registerActions])

  return (
    <div className="flex h-full flex-col">
      <div className="max-w-md rounded-lg border border-gray-200 p-4">
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <span>Starting {instanceId}...</span>
          </div>
        ) : resultMessage?.success ? (
          <div className="text-green-600">Start success! {resultMessage.data.instanceName}</div>
        ) : (
          <div>Instance ID: {instanceId}</div>
        )}
      </div>
    </div>
  )
}

export default start_instance
