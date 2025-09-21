import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PlusIcon, Loader2Icon } from 'lucide-react'
import { apiClient, type User } from '@/lib/api-client'

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | undefined>()

  const fetchUsers = async (cursor?: string) => {
    try {
      setLoading(true)
      const response = await apiClient.getUsers({ cursor, limit: 20 })
      
      if (cursor) {
        // Append to existing users for infinite scroll
        setUsers(prev => [...prev, ...response.users])
      } else {
        // Replace users for initial load
        setUsers(response.users)
      }
      
      setHasMore(response.hasMore)
      setNextCursor(response.nextCursor)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const loadMore = () => {
    if (nextCursor && !loading) {
      fetchUsers(nextCursor)
    }
  }

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2Icon className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Users</h1>
            <p className="text-gray-600 mt-2">
              Manage user profiles and their uploaded media
            </p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Error loading users</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => fetchUsers()} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

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
        {users.length === 0 ? (
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
        ) : (
          <>
            {users.map((user) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{user.name}</CardTitle>
                      <CardDescription>
                        Created {new Date(user.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/users/${user.id}`}>View</Link>
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
            
            {hasMore && (
              <div className="flex justify-center">
                <Button 
                  onClick={loadMore} 
                  disabled={loading}
                  variant="outline"
                >
                  {loading ? (
                    <>
                      <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
