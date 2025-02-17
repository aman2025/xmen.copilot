'use client'
import React, { useState, useRef, useEffect } from 'react'

const HomePage = () => {
  const [scale, setScale] = useState(1)
  const svgRef = useRef(null)

  // Handle zoom functionality
  const handleWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY
    setScale(prevScale => {
      const newScale = delta > 0 ? prevScale * 0.9 : prevScale * 1.1
      return Math.min(Math.max(newScale, 0.5), 2) // Limit scale between 0.5 and 2
    })
  }

  useEffect(() => {
    const svg = svgRef.current
    if (svg) {
      svg.addEventListener('wheel', handleWheel)
      return () => svg.removeEventListener('wheel', handleWheel)
    }
  }, [])

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">服务结构图</h2>
        <div className="w-full overflow-auto">
          <svg
            ref={svgRef}
            width="1200"
            height="600"
            className="mx-auto"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'center',
              transition: 'transform 0.1s'
            }}
          >
            <g transform="translate(100, 100)">
              {/* Services Node */}
              <rect x="0" y="0" width="120" height="40" rx="20" 
                className="fill-blue-500" />
              <text x="60" y="25" textAnchor="middle" className="fill-white">
                services
              </text>

              {/* DFA-MCF Node */}
              <rect x="200" y="-30" width="120" height="40" rx="8" 
                className="fill-indigo-500" />
              <text x="260" y="-5" textAnchor="middle" className="fill-white">
                DFA-MCF
              </text>

              {/* DFA-CRC Node */}
              <rect x="200" y="50" width="120" height="40" rx="8" 
                className="fill-gray-500" />
              <text x="260" y="75" textAnchor="middle" className="fill-white">
                DFA-CRC
              </text>

              {/* Instance Nodes */}
              <rect x="400" y="-30" width="220" height="40" rx="8" 
                className="fill-indigo-400" />
              <text x="510" y="-5" textAnchor="middle" className="fill-white">
                DFA-MCF@10.168.106.95
              </text>

              <rect x="400" y="50" width="220" height="40" rx="8" 
                className="fill-gray-400" />
              <text x="510" y="75" textAnchor="middle" className="fill-white">
                DFA-CRC@10.168.11.55
              </text>

              {/* Container Instance Nodes */}
              <rect x="700" y="-60" width="220" height="40" rx="8" 
                className="fill-indigo-300" />
              <text x="810" y="-35" textAnchor="middle" className="fill-white">
                DFA-UAS@10.168.106.95
              </text>

              <rect x="700" y="0" width="220" height="40" rx="8" 
                className="fill-indigo-300" />
              <text x="810" y="25" textAnchor="middle" className="fill-white">
                DFA-BPM@10.168.106.95
              </text>

              <rect x="700" y="60" width="220" height="40" rx="8" 
                className="fill-gray-300" />
              <text x="810" y="85" textAnchor="middle" className="fill-white">
                DFA-UAS@10.168.11.55
              </text>

              <rect x="700" y="120" width="220" height="40" rx="8" 
                className="fill-gray-300" />
              <text x="810" y="145" textAnchor="middle" className="fill-white">
                DFA-BMS@10.168.11.55
              </text>

              {/* Connecting Lines */}
              <path d="M120 20 L200 -10" className="stroke-gray-400" />
              <path d="M120 20 L200 70" className="stroke-gray-400" />
              
              <path d="M320 -10 L400 -10" className="stroke-gray-400" />
              <path d="M320 70 L400 70" className="stroke-gray-400" />
              
              <path d="M620 -10 L700 -40" className="stroke-gray-400" />
              <path d="M620 -10 L700 20" className="stroke-gray-400" />
              
              <path d="M620 70 L700 80" className="stroke-gray-400" />
              <path d="M620 70 L700 140" className="stroke-gray-400" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  )
}

export default HomePage
