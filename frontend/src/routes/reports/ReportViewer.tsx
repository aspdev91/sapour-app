import { useParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ReportViewer() {
  const { reportId } = useParams<{ reportId: string }>()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Report Viewer</h1>
        <p className="text-gray-600 mt-2">
          Read-only report with full provenance information
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Details</CardTitle>
          <CardDescription>
            Report ID: {reportId}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Report viewer coming soon...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
