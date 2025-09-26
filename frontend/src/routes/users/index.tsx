import { Routes, Route } from 'react-router-dom'
import UsersList from './UsersList'
import NewUser from './NewUser'
import UserDetail from './UserDetail'

export default function UsersRoutes() {
  return (
    <Routes>
      <Route index element={<UsersList />} />
      <Route path="new" element={<NewUser />} />
      <Route path=":userId" element={<UserDetail />} />
    </Routes>
  )
}
