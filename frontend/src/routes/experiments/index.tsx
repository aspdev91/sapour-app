import { Routes, Route } from 'react-router-dom'
import ExperimentsList from './ExperimentsList'

export default function ExperimentsRoutes() {
  return (
    <Routes>
      <Route index element={<ExperimentsList />} />
    </Routes>
  )
}
