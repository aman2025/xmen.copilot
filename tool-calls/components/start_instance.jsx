'use client'

import React, { useEffect, useState, useRef } from 'react'

const start_instance = ({ params, onComplete, registerActions, sendMessage, toolCallId }) => {
  const { instanceId } = params || {}
  const [loading, setLoading] = useState(false)
  const [resultMessage, setResultMessage] = useState(null)
  const hasStarted = useRef(false)

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
      // Construct response message based on return code
      const responseMessage =
        data.retCode === 0
          ? {
              success: true,
              data: { instanceName: data.result?.instanceName }
            }
          : {
              success: false,
              error: data.error
            }
      // Just update the state and wait for user to click complete
      setResultMessage(responseMessage)
    } catch (error) {
      console.error('Failed to start instance:', error)
      const errorMessage = { success: false, error: 'Failed to start instance' }
      setResultMessage(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Register actions and trigger startInstance on mount
  useEffect(() => {
    if (registerActions) {
      // Make sure handleAccept always has access to the latest resultMessage
      registerActions({
        handleAccept: () => {
          sendMessage({
            content: JSON.stringify(resultMessage),
            role: 'tool',
            toolCallId: toolCallId
          })
          onComplete()
        },
        handleReject: () => {
          // Send a rejection message if needed
          sendMessage({
            content: JSON.stringify({ success: false, error: 'Operation rejected by user' }),
            role: 'tool',
            toolCallId: toolCallId
          })
          onComplete()
        }
      })
    }

    if (!hasStarted.current) {
      startInstance() // Start the instance when component mounts
      hasStarted.current = true
    }
  }, [registerActions, resultMessage]) // Add resultMessage as a dependency

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
