'use client'
import React from 'react'

const HomePage = () => {
  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold">集群信息</h2>
        <p>This is the cluster information container.</p>
      </div>
      <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold">逻辑部署图</h2>
        <p>This is the logical deployment information container.</p>
      </div>
      <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold">物理部署图</h2>
        <p>This is the physical deployment diagram container.</p>
      </div>
    </div>
  )
}

export default HomePage
