import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import Layout from './components/Layout'
import Home from './routes/Home'
import UsersRoutes from './routes/users'
import ExperimentsRoutes from './routes/experiments'
import ReportsRoutes from './routes/reports'

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/users/*" element={<UsersRoutes />} />
          <Route path="/experiments/*" element={<ExperimentsRoutes />} />
          <Route path="/reports/*" element={<ReportsRoutes />} />
        </Routes>
      </Layout>
      <Toaster position="top-right" />
    </div>
  )
}

export default App
