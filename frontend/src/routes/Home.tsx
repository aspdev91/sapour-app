import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome to Sapour Admin</h1>
        <p className="text-gray-600 mt-2">
          Manage users, conduct experiments, and generate personality reports.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              Create and manage user profiles with media uploads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-muted-foreground">Total users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Experiments</CardTitle>
            <CardDescription>
              Run first impression, personality type, and compatibility experiments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-muted-foreground">Active experiments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reports</CardTitle>
            <CardDescription>
              View generated immutable reports with full provenance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-muted-foreground">Generated reports</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
