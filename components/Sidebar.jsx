'use client'
import React, { useState } from 'react'
import {
  HomeIcon,
  ListTree,
  LayoutDashboard,
  ClipboardList,
  Wrench,
  Settings,
  Network,
  Download
} from 'lucide-react'

const Sidebar = () => {
  // State for active menu item and footer button
  const [activeMenuIndex, setActiveMenuIndex] = useState(0)
  const [activeFooterButton, setActiveFooterButton] = useState('集群')

  const menuItems = [
    { icon: <HomeIcon className="h-8 w-8" />, label: '首页' },
    { icon: <LayoutDashboard className="h-8 w-8" />, label: '应用管理' },
    { icon: <ListTree className="h-8 w-8" />, label: '节点管理' },
    { icon: <ClipboardList className="h-8 w-8" />, label: '日志管理' },
    { icon: <Wrench className="h-8 w-8" />, label: '运维工具集' }
  ]

  const footerButtons = [
    { icon: <Settings className="h-5 w-5" />, label: '设置' },
    { icon: <Network className="h-5 w-5" />, label: '集群' },
    { icon: <Download className="h-5 w-5" />, label: '安装' }
  ]

  return (
    <aside className="flex w-[228px] flex-col bg-white shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-center p-4">
        <span className="text-xl font-bold text-gray-800 dark:text-white">
          <img src="/logo.png" alt="Copilot" className="w-[175px]" />
        </span>
      </div>

      {/* Main Navigation - Added overflow-y-auto for scrolling */}
      <nav className="flex-1 overflow-y-auto px-8 py-6">
        <ul className="space-y-2">
          {menuItems.map((item, index) => (
            <li
              key={index}
              onClick={() => setActiveMenuIndex(index)}
              className={`flex h-[88px] cursor-pointer flex-col items-center justify-center rounded-md border p-2 transition-all duration-200 
                ${
                  activeMenuIndex === index
                    ? 'border-[#767ada] bg-[#767ada] shadow-[0_3px_8px_rgba(118,122,218,0.36)]'
                    : 'border-transparent hover:border-[#767ada]'
                }`}
            >
              <div
                className={`flex flex-col items-center justify-center ${activeMenuIndex === index ? 'text-white' : 'text-[#6163b5]'}`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer - Fixed at bottom */}
      <div className="flex  justify-around  border-gray-200 bg-[#f5f5f9] dark:border-gray-700">
        {footerButtons.map((button) => (
          <button
            key={button.label}
            onClick={() => setActiveFooterButton(button.label)}
            className={`flex flex-1 flex-col  items-center px-4 py-2 transition-colors
              ${
                activeFooterButton === button.label
                  ? 'bg-[#fff] text-[#767ada]'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            {button.icon}
            <span className="text-sm">{button.label}</span>
          </button>
        ))}
      </div>
    </aside>
  )
}

export default Sidebar
