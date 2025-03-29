'use client'

import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import toolEventEmitter, { TOOL_EVENTS } from '../utils/events/toolEventEmitter';

const ToolApprovalDialog = () => {
  const [pendingTools, setPendingTools] = useState([]);
  
  useEffect(() => {
    // Listen for tool requested events
    const handleToolRequested = (toolData) => {
      setPendingTools(prev => [...prev, toolData]);
    };
    
    // Listen for tool executed events to remove from pending
    const handleToolExecuted = ({ toolCallId }) => {
      setPendingTools(prev => prev.filter(tool => tool.toolCallId !== toolCallId));
    };
    
    // Listen for tool rejected events to remove from pending
    const handleToolRejected = ({ toolCallId }) => {
      setPendingTools(prev => prev.filter(tool => tool.toolCallId !== toolCallId));
    };
    
    // Register event listeners
    toolEventEmitter.on(TOOL_EVENTS.TOOL_REQUESTED, handleToolRequested);
    toolEventEmitter.on(TOOL_EVENTS.TOOL_EXECUTED, handleToolExecuted);
    toolEventEmitter.on(TOOL_EVENTS.TOOL_REJECTED, handleToolRejected);
    
    // Cleanup event listeners
    return () => {
      toolEventEmitter.off(TOOL_EVENTS.TOOL_REQUESTED, handleToolRequested);
      toolEventEmitter.off(TOOL_EVENTS.TOOL_EXECUTED, handleToolExecuted);
      toolEventEmitter.off(TOOL_EVENTS.TOOL_REJECTED, handleToolRejected);
    };
  }, []);
  
  const handleApprove = (toolData) => {
    toolEventEmitter.emit(TOOL_EVENTS.TOOL_APPROVED, toolData);
  };
  
  const handleReject = (toolData) => {
    toolEventEmitter.emit(TOOL_EVENTS.TOOL_REJECTED, toolData);
    
    // Send rejection message to assistant
    toolData.sendMessage({
      content: JSON.stringify({ 
        success: false, 
        error: 'Tool execution rejected by user' 
      }),
      role: 'tool',
      toolCallId: toolData.toolCallId
    });
  };
  
  if (pendingTools.length === 0) {
    return null;
  }
  
  return (
    <div className="fixed bottom-20 right-4 z-50 max-w-md">
      {pendingTools.map((toolData) => (
        <div 
          key={toolData.toolCallId}
          className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-md"
        >
          <div className="mb-2 flex items-center">
            <AlertCircle className="mr-2 h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-medium">Tool Execution Request</h3>
          </div>
          
          <div className="mb-3 space-y-2">
            <p className="text-sm font-semibold text-gray-700">
              Tool: <span className="font-mono">{toolData.toolName}</span>
            </p>
            <div className="rounded bg-gray-50 p-2">
              <pre className="text-xs text-gray-800">
                {JSON.stringify(toolData.toolArgs, null, 2)}
              </pre>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => handleReject(toolData)}
              className="flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <XCircle className="mr-1 h-4 w-4 text-red-500" />
              Reject
            </button>
            <button
              onClick={() => handleApprove(toolData)}
              className="flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              <CheckCircle className="mr-1 h-4 w-4" />
              Approve
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ToolApprovalDialog; 