'use client'
import React from 'react'

const HomePage = () => {
  return (
    <div className="flex flex-col gap-4">
      {/* First row - single full-width item */}
      <div>
        <h2 className="mb-2 text-sm font-semibold">集群信息</h2>
        <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <p>This is the cluster information container.</p>
        </div>
      </div>

      {/* Second row - two equal-width items */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h2 className="mb-2 text-sm font-semibold">逻辑部署图</h2>
          <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
            <p>This is the logical deployment information container.</p>
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold">物理部署图</h2>
          <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
            <p>This is the physical deployment diagram container.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
