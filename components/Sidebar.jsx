import React from 'react'
    import { HomeIcon, ListTree, LayoutDashboard, ClipboardList, Wrench } from 'lucide-react'

    const Sidebar = () => {
      const menuItems = [
        { icon: <HomeIcon />, label: '首页' },
        { icon: <LayoutDashboard />, label: '应用管理' },
        { icon: <ListTree />, label: '节点管理' },
        { icon: <ClipboardList />, label: '日志管理' },
        { icon: <Wrench />, label: '运维工具集' },
      ]

      return (
        <aside className="w-64 bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 flex items-center justify-center">
            <span className="text-xl font-bold text-gray-800 dark:text-white">X-MEN</span>
          </div>
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item, index) => (
                <li key={index}>
                  <a
                    href="#"
                    className="flex items-center p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  >
                    <span className="mr-2">{item.icon}</span>
                    <span>{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-around">
            <button className="text-gray-700 dark:text-gray-300">设置</button>
            <button className="text-gray-700 dark:text-gray-300">集群</button>
            <button className="text-gray-700 dark:text-gray-300">安装</button>
          </div>
        </aside>
      )
    }

    export default Sidebar
