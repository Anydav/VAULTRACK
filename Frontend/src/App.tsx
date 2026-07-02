import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'

const Placeholder = ({ title }: { title: string }) => (
  <div className="p-8">{title} - Placeholder</div>
)

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Placeholder title="Login" />} />
      <Route path="/signup" element={<Placeholder title="Signup" />} />

      <Route path="/" element={<MainLayout />}> 
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Placeholder title="Dashboard" />} />
        <Route path="portfolio" element={<Placeholder title="Portfolio" />} />
        <Route path="accounts" element={<Placeholder title="Accounts" />} />
        <Route path="assets" element={<Placeholder title="Assets" />} />
        <Route path="history" element={<Placeholder title="History" />} />
        <Route path="settings" element={<Placeholder title="Settings" />} />
      </Route>
    </Routes>
  )
}
