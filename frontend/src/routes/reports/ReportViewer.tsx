import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileTextIcon, 
  CalendarIcon, 
  BrainIcon, 
  UserIcon, 
  ShareIcon, 
  DownloadIcon,
  Loader2Icon,
  ClockIcon,
  TagIcon,
  ShieldCheckIcon
} from 'lucide-react';
import { apiClient, type Report } from '@/lib/api-client';
import { toast } from 'sonner';

export default function ReportViewer() {
  const { reportId } = useParams<{ reportId: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      if (!reportId) return;

      try {
        setLoading(true);
        const reportData = await apiClient.getReport(reportId);
        setReport(reportData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load report');
        toast.error('Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId]);

  const handleShare = async () => {
    if (!report) return;
    
    try {
      await navigator.share({
        title: `${report.reportType.replace('_', ' ')} Report`,
        text: `Generated personality report for analysis`,
        url: window.location.href,
      });
    } catch (error) {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Report URL copied to clipboard');
    }
  };

  const handleDownload = () => {
    if (!report) return;
    
    const content = `
# ${report.reportType.replace('_', ' ').toUpperCase()} REPORT

**Generated:** ${new Date(report.createdAt).toLocaleString()}
**Report ID:** ${report.id}
**AI Provider:** ${report.aiProviderName} ${report.aiModelName}
**Template:** ${report.templateRevisionLabel}

---

${report.content}

---

## Provenance Information

- **Report Type:** ${report.reportType}
- **Primary User ID:** ${report.primaryUserId}
${report.secondaryUserId ? `- **Secondary User ID:** ${report.secondaryUserId}` : ''}
- **Template Document:** ${report.templateDocumentId}
- **Template Revision:** ${report.templateRevisionId} (${report.templateRevisionLabel})
- **AI Provider:** ${report.aiProviderName}
- **AI Model:** ${report.aiModelName}
- **Generated At:** ${new Date(report.createdAt).toISOString()}

This report was generated using AI analysis and should be used for informational purposes only.
    `.trim();
    
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.reportType}_report_${new Date(report.createdAt).toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Report downloaded successfully');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2Icon className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Report Viewer</h1>
          <p className="text-gray-600 mt-2">Read-only report with full provenance information</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Error loading report</CardTitle>
            <CardDescription>{error || 'Report not found'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/reports">Back to Reports</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold capitalize">
            {report.reportType.replace('_', ' ')} Report
          </h1>
          <p className="text-gray-600 mt-2">Immutable AI-generated personality analysis</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleShare}>
            <ShareIcon className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <DownloadIcon className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button asChild variant="outline">
            <Link to="/reports">Back to Reports</Link>
          </Button>
        </div>
      </div>

      {/* Provenance Card - Immutable Record */}
      <Card className="border-primary bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheckIcon className="w-5 h-5" />
            Provenance & Immutable Record
          </CardTitle>
          <CardDescription>
            This report is immutable and cryptographically verifiable. All generation details are preserved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <CalendarIcon className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Generated</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(report.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <BrainIcon className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">AI Model</p>
                <p className="text-sm text-muted-foreground">
                  {report.aiProviderName} {report.aiModelName}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <FileTextIcon className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Template</p>
                <p className="text-sm text-muted-foreground">
                  {report.templateRevisionLabel}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <TagIcon className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Report ID</p>
                <p className="text-xs font-mono text-muted-foreground">
                  {report.id}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="w-5 h-5" />
            Report Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {report.reportType.replace('_', ' ')}
              </Badge>
              {report.secondaryUserId && (
                <Badge variant="secondary">Compatibility Analysis</Badge>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Primary Subject</p>
                <p className="text-muted-foreground">User ID: {report.primaryUserId}</p>
              </div>
              
              {report.secondaryUserId && (
                <div>
                  <p className="font-medium">Secondary Subject</p>
                  <p className="text-muted-foreground">User ID: {report.secondaryUserId}</p>
                </div>
              )}
              
              <div>
                <p className="font-medium">Template Document</p>
                <p className="text-muted-foreground font-mono text-xs">
                  {report.templateDocumentId}
                </p>
              </div>
              
              <div>
                <p className="font-medium">Template Revision</p>
                <p className="text-muted-foreground">
                  {report.templateRevisionId} - {report.templateRevisionLabel}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileTextIcon className="w-5 h-5" />
            Analysis Report
          </CardTitle>
          <CardDescription>
            AI-generated personality analysis based on uploaded media and selected template
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {report.content}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClockIcon className="w-5 h-5" />
            Technical Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
            <div>
              <p className="font-medium font-sans mb-1">Report ID</p>
              <p className="break-all bg-muted p-2 rounded">{report.id}</p>
            </div>
            
            <div>
              <p className="font-medium font-sans mb-1">Template Document ID</p>
              <p className="break-all bg-muted p-2 rounded">{report.templateDocumentId}</p>
            </div>
            
            <div>
              <p className="font-medium font-sans mb-1">Creation Timestamp</p>
              <p className="bg-muted p-2 rounded">{new Date(report.createdAt).toISOString()}</p>
            </div>
            
            <div>
              <p className="font-medium font-sans mb-1">Primary User ID</p>
              <p className="break-all bg-muted p-2 rounded">{report.primaryUserId}</p>
            </div>
            
            {report.secondaryUserId && (
              <div>
                <p className="font-medium font-sans mb-1">Secondary User ID</p>
                <p className="break-all bg-muted p-2 rounded">{report.secondaryUserId}</p>
              </div>
            )}
            
            <div>
              <p className="font-medium font-sans mb-1">Template Revision</p>
              <p className="bg-muted p-2 rounded">{report.templateRevisionId}</p>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          <div className="text-xs text-muted-foreground space-y-2">
            <p className="font-medium">Immutability Notice:</p>
            <p>
              This report was generated at {new Date(report.createdAt).toLocaleString()} and is immutable. 
              Any modifications to this record would be detectable and invalidate the provenance chain.
            </p>
            <p>
              The report content, metadata, and generation parameters are cryptographically bound 
              to ensure authenticity and prevent tampering.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
