'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'

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
              data: data.result
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
      <div className="flex flex-col items-center justify-center gap-4 p-6">
        {loading ? (
          <div className="flex flex-col items-center gap-4 transition-all duration-300">
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" strokeWidth={2} />
            </div>
            <span className="animate-pulse text-lg font-medium text-gray-700">
              Starting instance {instanceId}...
            </span>
            <div className="h-2 w-48 overflow-hidden rounded-full bg-gray-200">
              <div className="h-full w-full animate-progressBar bg-blue-500" />
            </div>
          </div>
        ) : resultMessage?.success ? (
          <div className="transform space-y-3 transition-all duration-500">
            <div className="flex items-center justify-center">
              <CheckCircle2
                className="h-12 w-12 animate-checkmark  text-green-500"
                strokeWidth={1}
              />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-green-500">Start Successful!</h3>
              <p className="mt-1 text-sm" style={{ color: '#aaa' }}>
                {resultMessage.data}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <h3 className="text-lg font-medium text-gray-600">Instance Details</h3>
            <p className="mt-2 text-sm text-gray-600">ID: {instanceId}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default start_instance
