'use client'
import React from 'react'

const HomePage = () => {
  return (
    <div className="flex h-full flex-col gap-4">
      {/* First row - single full-width item (50% height) */}
      <div className="flex-1">
        <h2 className="mb-2 text-sm font-semibold">集群信息</h2>
        <div className="h-[calc(100%-28px)] rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          {/* Platform Group */}
          <div className="mb-8">
            <h3 className="mb-4 text-sm text-gray-500">平台</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-start gap-3 border">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50">
                  <svg
                    className="h-4 w-4 text-blue-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7h12M8 12h12M8 17h12M4 7h0M4 12h0M4 17h0"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-medium">DFA-CRC</div>
                  <div className="text-sm text-gray-500">运行中</div>
                </div>
              </div>
              <div className="flex items-start gap-3 border">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50">
                  <svg
                    className="h-4 w-4 text-blue-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7h12M8 12h12M8 17h12M4 7h0M4 12h0M4 17h0"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-medium">DFA-MCF</div>
                  <div className="text-sm text-gray-500">无运行实例</div>
                </div>
              </div>
            </div>
          </div>

          {/* Application Group */}
          <div>
            <h3 className="mb-4 text-sm text-gray-500">应用</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-start gap-3 border">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50">
                  <svg
                    className="h-4 w-4 text-blue-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-medium">E-PBOS-BASEFRAME</div>
                  <div className="text-sm text-gray-500">无运行实例</div>
                </div>
              </div>
            </div>
          </div>
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
