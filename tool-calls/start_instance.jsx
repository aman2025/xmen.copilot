'use client'

import React, { useEffect } from 'react'

const start_instance = ({ params, onComplete, registerActions }) => {
  const { instance_id } = params || {}

  const handleAccept = () => {
    const resultMessage = { success: true, data: { isntanceName: 'dfa-crc@10.168.106.95' } }
    onComplete(resultMessage)
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
      <div>get the instance: {instance_id}</div>
    </div>
  )
}

export default start_instance
