import { useParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function UserDetail() {
  const { userId } = useParams<{ userId: string }>()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Details</h1>
        <p className="text-gray-600 mt-2">
          View user profile, media gallery, and generated reports
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
          <CardDescription>
            User ID: {userId}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">User details coming soon...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
