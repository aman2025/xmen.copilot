'use client'

import React, { useEffect } from 'react'

const start_instance = ({ params, onComplete, registerActions, sendMessage, toolCallId }) => {
  const { instanceId } = params || {}

  const handleAccept = () => {
    const resultMessage = { success: true, data: { isntanceName: 'dfa-crc@10.168.106.95' } }
    // Send the tool response message before completing
    sendMessage({
      content: JSON.stringify(resultMessage),
      role: 'tool',
      toolCallId: toolCallId
    })
    onComplete()
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
      <div>get the instance: {instanceId}</div>
    </div>
  )
}

export default start_instance
