import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import {MainLayout} from './components/layout/MainLayout'
import Auth from './pages/Auth/Auth'
import Dashboard from './pages/Dashboard/Dashboard'
import Portfolio from './pages/Portfolio/portfolio'

const Placeholder = ({ title }: { title: string }) => (
  <div className="p-8">{title} - Placeholder</div>
)

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth" replace />} />
      <Route path="/auth" element={<Auth />} />
      

      <Route  element={<MainLayout />}> 
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="portfolio" element={<Portfolio />} />
        <Route path="accounts" element={<Placeholder title="Accounts" />} />
        <Route path="assets" element={<Placeholder title="Assets" />} />
        <Route path="history" element={<Placeholder title="History" />} />
        <Route path="settings" element={<Placeholder title="Settings" />} />
      </Route>
    </Routes>
  )
}
