'use client'
import React from 'react'

const HomePage = () => {
  return (
    <div className="flex h-full flex-col gap-4">
      {/* First row - single full-width item (50% height) */}
      <div className="flex-1">
        <h2 className="mb-2 text-sm font-semibold">集群信息</h2>
        <div className="h-[calc(100%-28px)] rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <p>This is the cluster information container.</p>
        </div>
      </div>

      {/* Second row - two equal-width items (50% height) */}
      <div className="grid flex-1 grid-cols-2 gap-4">
        <div className="h-full">
          <h2 className="mb-2 text-sm font-semibold">逻辑部署图</h2>
          <div className="h-[calc(100%-28px)] rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
            <p>This is the logical deployment information container.</p>
          </div>
        </div>

        <div className="h-full">
          <h2 className="mb-2 text-sm font-semibold">物理部署图</h2>
          <div className="h-[calc(100%-28px)] rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
            <p>This is the physical deployment diagram container.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
