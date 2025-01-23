'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { X } from 'lucide-react'
import { useState } from 'react'

const ToolBox = ({ isOpen, onClose, tool, params }) => {
  const renderTool = () => {
    if (!tool) return null

    // Directly import the component based on tool name
    const ToolComponent = require(`@/tool-calls/${tool}`).default
    return <ToolComponent params={params} onComplete={onClose} />
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose(false)}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {tool ? tool.replace(/_/g, ' ').toUpperCase() : ''}
            <X className="h-4 w-4 cursor-pointer" onClick={() => onClose(false)} />
          </DialogTitle>
        </DialogHeader>
        {renderTool()}
      </DialogContent>
    </Dialog>
  )
}

export default ToolBox
