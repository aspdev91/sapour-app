import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ReportsList() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-gray-600 mt-2">
          View all generated immutable reports with full provenance
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>No reports found</CardTitle>
          <CardDescription>
            Reports will appear here once experiments are completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Generate your first report by running an experiment
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
