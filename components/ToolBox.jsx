'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'

const ToolBox = ({ isOpen, onClose, tool, params }) => {
  const [toolActions, setToolActions] = useState({})

  const renderTool = () => {
    if (!tool) return null

    // Directly import the component based on tool name and pass registerActions prop
    const ToolComponent = require(`@/tool-calls/${tool}`).default
    return (
      <ToolComponent
        params={params}
        onComplete={(result) => onClose(result)}
        registerActions={setToolActions}
      />
    )
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

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose(false)}>
      <DialogContent className="h-[80vh] bg-white sm:max-w-[888px]">
        <VisuallyHidden asChild>
          <DialogTitle></DialogTitle>
        </VisuallyHidden>
        {renderTool()}
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

export default ToolBox
