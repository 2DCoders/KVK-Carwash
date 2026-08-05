import { Route, Routes, Navigate } from "react-router-dom"
import Login from "./pages/login"
import Reports from "./pages/reports"
import SettingsPage from "./pages/settings"
import AdminLayout from "./layouts/admin-layout"
import Dayend from "./pages/dayend"
import CarwashServices from "./pages/services"
import Packages from "./pages/packages"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      
      {/* Admin Dashboard Routes */}
      <Route element={<AdminLayout><CarwashServices /></AdminLayout>} path="/services" />
      <Route element={<AdminLayout><Packages /></AdminLayout>} path="/packages" />
      <Route element={<AdminLayout><Dayend /></AdminLayout>} path="/dayend" />
      <Route element={<AdminLayout><Reports /></AdminLayout>} path="/reports" />
      <Route element={<AdminLayout><SettingsPage /></AdminLayout>} path="/settings" />
      
      {/* Redirect to dashboard */}
      <Route path="*" element={<Navigate to="/services" />} />
    </Routes>
  )
}

export default App
