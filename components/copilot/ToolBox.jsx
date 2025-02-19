'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'
import GetInstances from '@/tool-calls/components/get_instances'

/**
 * Combined ToolBox component that handles both dialog display and tool execution
 */
export const ToolBox = ({ toolState, onToolComplete }) => {
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

  const handleAccept = () => {
    if (toolActions.handleAccept) {
      toolActions.handleAccept()
    }
  }

  const handleReject = () => {
    if (toolActions.handleReject) {
      toolActions.handleReject()
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
        onComplete={(result) => onToolComplete(result)}
        registerActions={setToolActions}
      />
    )
  }

  if (!toolState.isOpen) return null

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="flex h-[80vh] flex-col bg-white sm:max-w-[888px]">
        <VisuallyHidden asChild>
          <DialogTitle>Tool Execution</DialogTitle>
        </VisuallyHidden>
        <div className="flex-1 overflow-y-auto">{renderTool()}</div>
        <DialogFooter className="mt-auto">
          <Button variant="outline" onClick={handleReject}>
            Cancel
          </Button>
          <Button onClick={handleAccept}>Accept</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
