'use client'
import React from 'react'
import DeploymentGraph from './components/DeploymentGraph'

const HomePage = () => {
  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">集群信息</h2>
        <p>This is the cluster information container.</p>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">逻辑部署图</h2>
        <DeploymentGraph />
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">物理部署图</h2>
        <p>This is the physical deployment diagram container.</p>
      </div>
    </div>
  )
}

export default HomePage
