import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PlusIcon } from 'lucide-react'

export default function UsersList() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-gray-600 mt-2">
            Manage user profiles and their uploaded media
          </p>
        </div>
        <Button asChild>
          <Link to="/users/new">
            <PlusIcon className="w-4 h-4 mr-2" />
            Add User
          </Link>
        </Button>
      </div>

      <div className="space-y-4">
        {/* Placeholder for user list - will be replaced with actual data */}
        <Card>
          <CardHeader>
            <CardTitle>No users found</CardTitle>
            <CardDescription>
              Get started by creating your first user profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/users/new">Create first user</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
