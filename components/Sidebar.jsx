import React from 'react'
import { HomeIcon, ListTree, LayoutDashboard, ClipboardList, Wrench } from 'lucide-react'

const Sidebar = () => {
  const menuItems = [
    { icon: <HomeIcon className="h-8 w-8" />, label: '首页' },
    { icon: <LayoutDashboard className="h-8 w-8" />, label: '应用管理' },
    { icon: <ListTree className="h-8 w-8" />, label: '节点管理' },
    { icon: <ClipboardList className="h-8 w-8" />, label: '日志管理' },
    { icon: <Wrench className="h-8 w-8" />, label: '运维工具集' }
  ]

  return (
    <aside className="flex w-[228px] flex-col bg-white ">
      <div className="flex items-center justify-center p-4">
        <span className="text-xl font-bold text-gray-800 dark:text-white">X-MEN</span>
      </div>
      <nav className="flex-1 px-8 py-4">
        <ul className="space-y-2">
          {menuItems.map((item, index) => (
            <li
              key={index}
              className={`flex h-[88px] flex-col items-center justify-center rounded-md border p-2 
                ${index === 0 ? 'border-[#767ada] bg-[#767ada] shadow-[0_3px_8px_rgba(118,122,218,0.36)]' : 'border-transparent hover:border-[#767ada]'}`}
            >
              <a
                href="#"
                className={`flex flex-col items-center justify-center ${index === 0 ? 'text-white' : 'text-[#6163b5]'}`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex justify-around border-t border-gray-200 p-4 dark:border-gray-700">
        <button className="text-gray-700 dark:text-gray-300">设置</button>
        <button className="text-gray-700 dark:text-gray-300">集群</button>
        <button className="text-gray-700 dark:text-gray-300">安装</button>
      </div>
    </aside>
  )
}

export default Sidebar
