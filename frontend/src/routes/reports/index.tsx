import { Routes, Route } from 'react-router-dom'
import ReportsList from './ReportsList'
import ReportViewer from './ReportViewer'

export default function ReportsRoutes() {
  return (
    <Routes>
      <Route index element={<ReportsList />} />
      <Route path=":reportId" element={<ReportViewer />} />
    </Routes>
  )
}
