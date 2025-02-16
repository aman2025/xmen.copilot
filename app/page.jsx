'use client'
import React, { useCallback, useEffect, useState } from 'react'
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'reactflow'
import 'reactflow/dist/style.css'

// Custom node styles for different levels
const nodeStyles = {
  root: {
    background: '#1d4ed8', // Deep blue for root
    color: 'white',
    padding: '8px 16px',
    borderRadius: '4px',
    minWidth: '100px',
  },
  service: {
    background: '#60a5fa', // Light blue for services
    color: 'white',
    padding: '6px 12px',
    borderRadius: '4px',
    minWidth: '80px',
  },
  instance: {
    background: '#f1f5f9', // Light gray for instances
    color: '#334155',
    padding: '4px 8px',
    borderRadius: '4px',
    minWidth: '160px',
    border: '1px solid #e2e8f0',
  },
}

// Custom node components
const CustomNode = ({ data, type }) => {
  const style = nodeStyles[type || 'instance']
  
  return (
    <div style={style} className="shadow-sm">
      <div className="text-sm font-medium truncate">{data.label}</div>
    </div>
  )
}

const nodeTypes = {
  root: (props) => <CustomNode {...props} type="root" />,
  service: (props) => <CustomNode {...props} type="service" />,
  instance: (props) => <CustomNode {...props} type="instance" />,
}

const ServiceStructureMap = ({ data }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  const processData = useCallback(() => {
    const newNodes = []
    const newEdges = []
    
    // Root node (Services)
    const rootNode = {
      id: 'root',
      type: 'root',
      position: { x: 50, y: 200 },
      data: { label: 'services' },
    }
    newNodes.push(rootNode)

    // Calculate vertical spacing
    const serviceGap = 100
    const instanceGap = 40
    let currentY = 0

    data.services.forEach((service, serviceIndex) => {
      // Service node
      const serviceNode = {
        id: `service-${service.serviceId}`,
        type: 'service',
        position: { x: 200, y: currentY },
        data: { label: service.serviceName },
      }
      newNodes.push(serviceNode)

      // Edge from root to service
      newEdges.push({
        id: `edge-root-${service.serviceId}`,
        source: 'root',
        target: `service-${service.serviceId}`,
        type: 'smoothstep',
        style: { stroke: '#94a3b8' },
      })

      // Calculate instances position
      let instanceY = currentY - ((service.instances?.length || 1) * instanceGap) / 2

      // Process instances
      service.instances?.forEach((instance, instanceIndex) => {
        const instanceNode = {
          id: `instance-${instance.instanceId}`,
          type: 'instance',
          position: { x: 400, y: instanceY },
          data: { label: instance.instanceName },
        }
        newNodes.push(instanceNode)

        // Edge from service to instance
        newEdges.push({
          id: `edge-${service.serviceId}-${instance.instanceId}`,
          source: `service-${service.serviceId}`,
          target: `instance-${instance.instanceId}`,
          type: 'smoothstep',
          style: { stroke: '#94a3b8' },
        })

        instanceY += instanceGap
      })

      currentY += serviceGap
    })

    setNodes(newNodes)
    setEdges(newEdges)
  }, [data, setNodes, setEdges])

  useEffect(() => {
    processData()
  }, [processData])

  return (
    <div className="h-[600px] w-full bg-white rounded-lg border border-gray-200">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.5}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
        }}
      >
        <Controls showInteractive={false} />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  )
}

const HomePage = () => {
  const [serviceData, setServiceData] = useState(null)

  useEffect(() => {
    // In a real application, you would fetch this data from an API
    fetch('/api/proxy/index/logicDeployInfo')
      .then(res => res.json())
      .then(data => setServiceData(data))
  }, [])

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold p-4 border-b">服务结构图</h2>
        {serviceData && <ServiceStructureMap data={serviceData} />}
      </div>
    </div>
  )
}

export default HomePage
