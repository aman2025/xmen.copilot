'use client'

import React from 'react'
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'

const ToolBox = ({ isOpen, onClose, tool, params }) => {
  const toolRef = React.useRef(null)

  const renderTool = () => {
    if (!tool) return null

    // Directly import the component based on tool name
    const ToolComponent = require(`@/tool-calls/${tool}`).default
    return <ToolComponent ref={toolRef} params={params} onComplete={(result) => onClose(result)} />
  }

  const handleAccept = () => {
    // Trigger the tool component's handleAccept
    if (toolRef.current?.handleAccept) {
      toolRef.current.handleAccept()
    }
  }

  const handleReject = () => {
    // Trigger the tool component's handleReject
    if (toolRef.current?.handleReject) {
      toolRef.current.handleReject()
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
