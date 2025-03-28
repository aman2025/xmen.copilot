'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

export const ToolBox = ({ toolState, onToolComplete, sendMessage }) => {
  const [toolActions, setToolActions] = useState({})
  const [ToolComponent, setToolComponent] = useState(null)

  // Load tool component dynamically when toolState.tool changes
  useEffect(() => {
    if (toolState.tool) {
      const importTool = async () => {
        try {
          const component = await import(`@/tool-calls/components/${toolState.tool}`)
          setToolComponent(() => component.default)
        } catch (error) {
          console.error('Error loading tool component:', error)
        }
      }
      importTool()
    } else {
      setToolComponent(null)
    }
  }, [toolState.tool])

  const handleComplete = () => {
    if (toolActions.handleAccept) {
      toolActions.handleAccept()
    }
  }

  if (!toolState.isOpen) return null

  return (
    <div
      className="z-10 flex h-full flex-col rounded-lg border border-dashed border-[#dfdee5] bg-white p-2"
      style={{ marginTop: '-28px' }}
    >
      <div className="flex-1 overflow-y-auto">
        {ToolComponent && (
          <ToolComponent
            params={toolState.params}
            onComplete={() => onToolComplete()}
            registerActions={setToolActions}
            sendMessage={sendMessage}
            toolCallId={toolState.toolCallId}
          />
        )}
      </div>
      <div className="flex justify-end">
        <Button onClick={handleComplete} size="sm">
          complete
        </Button>
      </div>
    </div>
  )
}
