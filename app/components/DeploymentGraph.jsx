'use client'
import { useCallback, useEffect, useState } from 'react'
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'reactflow'
import 'reactflow/dist/style.css'
import useSWR from 'swr'

// Custom node styles for different statuses and types
const getNodeStyle = (type, status) => {
  const baseStyle = {
    padding: '12px 20px',
    borderRadius: '8px',
    minWidth: '180px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  }

  const typeStyles = {
    root: {
      background: '#1d4ed8',
      color: 'white',
      fontWeight: '600',
    },
    service: {
      background: '#3b82f6',
      color: 'white',
    },
    instance: {
      border: '1px solid #e2e8f0',
    },
  }

  // Status colors for instance nodes
  const statusColors = {
    0: '#22c55e',    // Running - Green
    10: '#eab308',   // Warning - Yellow
    11: '#ef4444',   // Error - Red
    default: '#f1f5f9', // Default - Light gray
  }

  const style = {
    ...baseStyle,
    ...typeStyles[type],
  }

  // Apply status colors only to instance nodes
  if (type === 'instance') {
    style.background = statusColors[status] || statusColors.default
    style.color = status ? 'white' : '#334155'
  }

  return style
}

// Custom node component
const CustomNode = ({ data, type }) => {
  return (
    <div style={getNodeStyle(type, data.status)}>
      <div className="text-sm font-medium">{data.label}</div>
      {data.version && (
        <div className="text-xs mt-1 opacity-80">v{data.version}</div>
      )}
    </div>
  )
}

const nodeTypes = {
  root: (props) => <CustomNode {...props} type="root" />,
  service: (props) => <CustomNode {...props} type="service" />,
  instance: (props) => <CustomNode {...props} type="instance" />,
}

// Add this constant at the top level for edge styles
const defaultEdgeStyle = {
  stroke: '#2563eb', // Bright blue color
  strokeWidth: 3,    // Thicker line
}

const DeploymentGraph = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // Fetch deployment data
  const { data: deploymentData, error } = useSWR(
    '/api/proxy/index/logicDeployInfo',
    (...args) => fetch(...args).then(res => res.json())
  )

  // Add this function to handle node dragging
  const onNodeDragStop = useCallback((event, node) => {
    // Update the node position in the nodes array
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === node.id) {
          return {
            ...n,
            position: node.position,
          }
        }
        return n
      })
    )
  }, [setNodes])

  const processData = useCallback(() => {
    if (!deploymentData) return

    const newNodes = []
    const newEdges = []
    
    // Root node
    const rootNode = {
      id: 'root',
      type: 'root',
      position: { x: 50, y: 200 },
      data: { label: 'Services' },
      draggable: true,  // Explicitly enable dragging
      connectable: true // Enable connections
    }
    newNodes.push(rootNode)

    // Layout configuration
    const serviceStartX = 300
    const instanceStartX = 600
    const containerStartX = 900
    const verticalGap = 100

    deploymentData.services.forEach((service, serviceIndex) => {
      const serviceY = serviceIndex * verticalGap * 2

      const serviceNode = {
        id: `service-${service.serviceId}`,
        type: 'service',
        position: { x: serviceStartX, y: serviceY },
        data: { label: service.serviceName },
        draggable: true,
        connectable: true
      }
      newNodes.push(serviceNode)

      // Edge from root to service
      newEdges.push({
        id: `edge-root-${service.serviceId}`,
        source: 'root',
        target: `service-${service.serviceId}`,
        type: 'smoothstep',
        animated: true,
        style: defaultEdgeStyle,  // Apply the new style
      })

      service.instances?.forEach((instance, instanceIndex) => {
        const instanceY = serviceY + (instanceIndex * verticalGap)

        const instanceNode = {
          id: `instance-${instance.instanceId}`,
          type: 'instance',
          position: { x: instanceStartX, y: instanceY },
          data: { 
            label: instance.instanceName,
            version: instance.appVersion,
            status: instance.instanceStatus,
          },
          draggable: true,
          connectable: true
        }
        newNodes.push(instanceNode)

        newEdges.push({
          id: `edge-${service.serviceId}-${instance.instanceId}`,
          source: `service-${service.serviceId}`,
          target: `instance-${instance.instanceId}`,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#94a3b8', strokeWidth: 2 }, // Ensure visible stroke color and width
        })

        instance.containerInstances?.forEach((container, containerIndex) => {
          const containerY = instanceY + ((containerIndex - 0.5) * verticalGap)

          const containerNode = {
            id: `container-${container.instanceId}`,
            type: 'instance',
            position: { x: containerStartX, y: containerY },
            data: { 
              label: container.instanceName,
              version: container.appVersion,
              status: container.instanceStatus,
            },
            draggable: true,
            connectable: true
          }
          newNodes.push(containerNode)

          newEdges.push({
            id: `edge-${instance.instanceId}-${container.instanceId}`,
            source: `instance-${instance.instanceId}`,
            target: `container-${container.instanceId}`,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#94a3b8', strokeWidth: 2 }, // Ensure visible stroke color and width
          })
        })
      })
    })

    setNodes(newNodes)
    setEdges(newEdges)
  }, [deploymentData, setNodes, setEdges])

  useEffect(() => {
    processData()
  }, [processData])

  if (error) return <div>Error loading deployment data</div>
  if (!deploymentData) return <div>Loading...</div>

  return (
    <div className="h-[800px] w-full bg-white dark:bg-gray-800 rounded-lg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: defaultEdgeStyle,  // Add default style here too
        }}
        connectionMode="loose"
      >
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            switch (node.type) {
              case 'root': return '#1d4ed8'
              case 'service': return '#3b82f6'
              default: return '#94a3b8'
            }
          }}
        />
      </ReactFlow>
    </div>
  )
}

export default DeploymentGraph