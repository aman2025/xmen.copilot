'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

/**
 * Combined ToolBox component that handles both dialog display and tool execution
 */
export const ToolBox = ({ toolState, onToolComplete, sendMessage }) => {
  const [toolActions, setToolActions] = useState({})
  const [dialogOpen, setDialogOpen] = useState(false)

  // Sync dialog state with toolState
  useEffect(() => {
    setDialogOpen(toolState.isOpen)
  }, [toolState.isOpen])

  const handleOpenChange = (open) => {
    setDialogOpen(open)
    if (!open) {
      onToolComplete()
    }
  }
  // trigger ToolComponent's handleAccept
  const handleComplete = () => {
    if (toolActions.handleAccept) {
      toolActions.handleAccept()
    }
  }

  // Render appropriate tool component based on tool name
  const renderTool = () => {
    if (!toolState.tool) return null

    // Directly import the component based on tool name and pass registerActions prop
    const ToolComponent = require(`@/tool-calls/components/${toolState.tool}`).default
    return (
      <ToolComponent
        params={toolState.params}
        onComplete={() => onToolComplete()}
        registerActions={setToolActions}
        sendMessage={sendMessage}
        toolCallId={toolState.toolCallId}
      />
    )
  }

  if (!toolState.isOpen) return null

  return (
    <div className="border">
      <div className="flex-1 overflow-y-auto">{renderTool()}</div>
      <div>
        <Button onClick={handleComplete}>complete</Button>
      </div>
    </div>
  )
}
