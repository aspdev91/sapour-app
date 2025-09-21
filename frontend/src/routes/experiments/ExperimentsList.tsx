import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ExperimentsList() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Experiments</h1>
        <p className="text-gray-600 mt-2">
          Run first impression, personality type, and compatibility experiments
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>First Impression</CardTitle>
            <CardDescription>
              Generate initial personality impressions from user media
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon...</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Type</CardTitle>
            <CardDescription>
              Analyze user's self-perception and personality type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon...</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compatibility</CardTitle>
            <CardDescription>
              Compare compatibility between two users for romance or friendship
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
