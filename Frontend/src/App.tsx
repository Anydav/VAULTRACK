import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import {MainLayout} from './components/layout/MainLayout'
import Auth from './pages/Auth/Auth'
import Dashboard from './pages/Dashboard/Dashboard'
import Portfolio from './pages/Portfolio/portfolio'
import AccountDetail from './pages/Accounts/accountDetail'
import History from './pages/History/history'
import Analysis from './pages/Analysis/portfolioAi'
import { AddAssetModalProvider } from "./context/addAssetModelcontext";
import AddAssetModal from "./components/addAsset/addAssetModel";
import { ToastProvider } from "./context/toastContext";
import AssetsList from './pages/Assets/assetsList'
import AssetDetail from "./pages/Assets/assetDetail";

const Placeholder = ({ title }: { title: string }) => (
  <div className="p-8">{title} - Placeholder</div>
)

export default function App() {
  return (
    <ToastProvider>
    <AddAssetModalProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="/auth" element={<Auth />} />

        <Route element={<MainLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="accounts/:accountId" element={<AccountDetail />} />
          <Route path="assets" element={<AssetsList />} />
          <Route path="assets/:assetId" element={<AssetDetail />} />
          <Route path="history" element={<History />} />
          <Route path="Analysis" element={<Analysis />} />
        </Route>
      </Routes>

      <AddAssetModal />
    </AddAssetModalProvider>
    </ToastProvider>
  )
}