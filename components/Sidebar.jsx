import React from 'react'
import { HomeIcon, ListTree, LayoutDashboard, ClipboardList, Wrench } from 'lucide-react'

const Sidebar = () => {
  const menuItems = [
    { icon: <HomeIcon />, label: '首页' },
    { icon: <LayoutDashboard />, label: '应用管理' },
    { icon: <ListTree />, label: '节点管理' },
    { icon: <ClipboardList />, label: '日志管理' },
    { icon: <Wrench />, label: '运维工具集' }
  ]

  return (
    <aside className="flex w-[228px] flex-col bg-white ">
      <div className="flex items-center justify-center p-4">
        <span className="text-xl font-bold text-gray-800 dark:text-white">X-MEN</span>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item, index) => (
            <li key={index}>
              <a
                href="#"
                className="flex items-center rounded-md p-2 text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <span className="mr-2">{item.icon}</span>
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
