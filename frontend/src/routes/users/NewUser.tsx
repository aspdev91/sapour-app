import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function NewUser() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New User</h1>
        <p className="text-gray-600 mt-2">
          Add a new user profile with initial media upload
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>
            Fill in the user details and upload at least one image or audio file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Form will be implemented later */}
            <p className="text-sm text-muted-foreground">Form coming soon...</p>
            <Button variant="outline" disabled>
              Save User
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
