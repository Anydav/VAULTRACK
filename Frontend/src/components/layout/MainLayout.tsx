import React from 'react'
import { Outlet } from 'react-router-dom'

const SidebarPlaceholder = () => (
  <aside className="w-64 bg-white border-r p-4">Sidebar</aside>
)

const TopNavPlaceholder = () => (
  <header className="h-16 bg-white border-b flex items-center px-4">TopNav</header>
)

export default function MainLayout() {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <SidebarPlaceholder />
      <div className="flex-1 flex flex-col">
        <TopNavPlaceholder />
        <main className="p-4 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

