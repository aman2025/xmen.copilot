'use client'
import React from 'react'
import { Layers2, LayoutGrid } from 'lucide-react'

const HomePage = () => {
  return (
    <div className="flex h-full flex-col gap-4">
      {/* First row - single full-width item (50% height) */}
      <div className="min-h-0 flex-1">
        <h2 className="mb-2 text-sm font-semibold">集群信息</h2>
        <div className="h-[calc(100%-28px)] overflow-y-auto rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          {/* Platform Group */}
          <div className="mb-8">
            <h3 className="mb-2 text-sm text-gray-300">平台</h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="flex items-center gap-4 rounded-md border border-gray-200 p-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-[#6163b5]">
                  <Layers2 className="h-7 w-7" />
                </div>
                <div>
                  <div className="font-medium">DFA-MCF</div>
                  <div className="text-sm text-gray-500">无运行实例</div>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-md border border-gray-200 p-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-[#6163b5]">
                  <Layers2 className="h-7 w-7" />
                </div>
                <div>
                  <div className="font-medium">DFA-CRC</div>
                  <div className="text-sm text-gray-500">运行中</div>
                </div>
              </div>
              <div></div>
            </div>
          </div>
          <div className="mb-8">
            <h3 className="mb-2 text-sm text-gray-300">应用</h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="flex items-center gap-4 rounded-md border border-gray-200 p-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-[#6163b5]">
                  <LayoutGrid className="h-7 w-7" />
                </div>
                <div>
                  <div className="font-medium">E-PBOS-BASEFRAME</div>
                  <div className="text-sm text-gray-500">无运行实例</div>
                </div>
              </div>
              <div></div>
              <div></div>
            </div>
          </div>
          {/* Application Group */}
        </div>
      </div>

      {/* Second row - two equal-width items (50% height) */}
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-4">
        <div className="min-h-0">
          <h2 className="mb-2 text-sm font-semibold">逻辑部署图</h2>
          <div className="h-[calc(100%-28px)] overflow-y-auto rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td className="w-24 border border-gray-200 p-3 text-center" rowspan="2">
                    平台
                  </td>
                  <td className="border border-gray-200 p-3">DFA-CRC</td>
                  <td className="border border-gray-200 p-3">DFA-CRC@10.168.106.78:29009</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 p-3">DFA-MCF</td>
                  <td className="border border-gray-200 p-3">DFA-MCF@10.168.106.78:8080</td>
                </tr>
                <tr>
                  <td className="w-24 border border-gray-200 p-3 text-center">应用</td>
                  <td className="border border-gray-200 p-3">E-PBOS-BASEFRAME</td>
                  <td className="border border-gray-200 p-3">
                    <div>E-PBOS-BASEFRAME@10.168.106.78:8080</div>
                    <div className="text-sm text-gray-500">(部署于DFA-MCF@10.168.106.78)</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="min-h-0">
          <h2 className="mb-2 text-sm font-semibold">物理部署图</h2>
          <div className="h-[calc(100%-28px)] overflow-y-auto rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td className="w-48 border border-gray-200 p-3 text-center" rowspan="3">
                    10.168.106.78
                  </td>
                  <td className="border border-gray-200 p-3">shinecrc@10.168.106.78</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 p-3">
                    bmsf@10.168.106.78
                    <br />
                    (启动于Tomcat@10.0.0.2)
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-200 p-3">dfa-gateway@10.168.106.78</td>
                </tr>
                <tr>
                  <td className="w-48 border border-gray-200 p-3 text-center" rowspan="3">
                    10.168.106.11
                  </td>
                  <td className="border border-gray-200 p-3">shinecrc@10.168.106.78</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 p-3">bmsf@10.168.106.78</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 p-3">dfa-gateway@10.168.106.78</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
