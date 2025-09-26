import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import {
  ArrowLeftIcon,
  Loader2Icon,
  GitBranchIcon,
  HistoryIcon,
  RotateCcwIcon,
  ExternalLinkIcon,
} from 'lucide-react';

// TODO: Import from api-client when template API is implemented
interface TemplateRevision {
  id: string;
  templateId: string;
  revisionNumber: number;
  content: string;
  changelog?: string;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
}

interface Template {
  id: string;
  name: string;
  type: string;
  status: 'draft' | 'published' | 'archived';
}

export default function TemplateVersions() {
  const { templateId } = useParams();
  const [template, setTemplate] = useState<Template | null>(null);
  const [revisions, setRevisions] = useState<TemplateRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const [reverting, setReverting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplate = async () => {
    if (!templateId) return;

    try {
      setLoading(true);
      // TODO: Replace with actual API calls when templates endpoint is implemented
      // const [templateResponse, revisionsResponse] = await Promise.all([
      //   apiClient.getTemplate(templateId),
      //   apiClient.getTemplateRevisions(templateId)
      // ]);
      // setTemplate(templateResponse.template);
      // setRevisions(revisionsResponse.revisions);

      // Mock data for now
      const mockTemplate: Template = {
        id: templateId,
        name: 'First Impression Template',
        type: 'first_impression',
        status: 'published',
      };

      const mockRevisions: TemplateRevision[] = [
        {
          id: 'v3',
          templateId: templateId,
          revisionNumber: 3,
          content: 'Updated template content with improvements...',
          changelog: 'Added better formatting and clearer instructions',
          isPublished: true,
          publishedAt: new Date('2024-01-15').toISOString(),
          createdAt: new Date('2024-01-15').toISOString(),
        },
        {
          id: 'v2',
          templateId: templateId,
          revisionNumber: 2,
          content: 'Updated template content...',
          changelog: 'Fixed typos and improved readability',
          isPublished: true,
          publishedAt: new Date('2024-01-10').toISOString(),
          createdAt: new Date('2024-01-10').toISOString(),
        },
        {
          id: 'v1',
          templateId: templateId,
          revisionNumber: 1,
          content: 'Initial template content...',
          changelog: 'Initial version',
          isPublished: true,
          publishedAt: new Date('2024-01-05').toISOString(),
          createdAt: new Date('2024-01-05').toISOString(),
        },
      ];

      setTemplate(mockTemplate);
      setRevisions(mockRevisions);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load template revisions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplate();
  }, [templateId]);

  const handleRevert = async (revisionId: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to revert to this revision? This will create a new revision based on the selected content.',
    );

    if (!confirmed) return;

    try {
      setReverting(revisionId);
      setError(null);

      // TODO: Replace with actual API call when templates endpoint is implemented
      // await apiClient.revertTemplate(templateId!, { revisionId });
      console.log('Reverting to revision:', revisionId);

      // Mock success for now
      setTimeout(() => {
        setReverting(null);
        // Refresh revisions to show new reverted revision
        fetchTemplate();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revert template');
      setReverting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2Icon className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading template revisions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchTemplate} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/templates">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Templates
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Template Revisions</h1>
            {template && (
              <div className="flex items-center space-x-2 mt-1">
                <p className="text-muted-foreground">{template.name}</p>
                <Badge
                  className={
                    template.status === 'published'
                      ? 'bg-green-100 text-green-800'
                      : template.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                  }
                >
                  {template.status}
                </Badge>
              </div>
            )}
          </div>
        </div>
        <Button asChild variant="outline">
          <Link to={`/templates/${templateId}`}>
            <ExternalLinkIcon className="h-4 w-4 mr-2" />
            Edit Template
          </Link>
        </Button>
      </div>

      <div className="space-y-4">
        {revisions.length === 0 ? (
          <div className="text-center py-12">
            <HistoryIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No revisions yet</h3>
            <p className="text-muted-foreground mb-4">
              Publish the template to create your first revision.
            </p>
            <Button asChild>
              <Link to={`/templates/${templateId}`}>Edit Template</Link>
            </Button>
          </div>
        ) : (
          revisions.map((revision, index) => (
            <Card
              key={revision.id}
              className={index === 0 ? 'border-green-200 bg-green-50/50' : ''}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <GitBranchIcon className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">Revision {revision.revisionNumber}</CardTitle>
                    </div>
                    {index === 0 && <Badge className="bg-green-100 text-green-800">Latest</Badge>}
                    {revision.isPublished && <Badge variant="outline">Published</Badge>}
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>Revision {revision.revisionNumber}</p>
                    <p>{new Date(revision.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                {revision.changelog && <CardDescription>{revision.changelog}</CardDescription>}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="bg-gray-50 rounded-md p-3 mb-4">
                  <p className="text-sm font-mono text-gray-600 line-clamp-3">{revision.content}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {revision.publishedAt && (
                      <p>Published {new Date(revision.publishedAt).toLocaleString()}</p>
                    )}
                  </div>
                  {index !== 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevert(revision.id)}
                      disabled={reverting === revision.id}
                    >
                      {reverting === revision.id ? (
                        <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <RotateCcwIcon className="h-4 w-4 mr-2" />
                      )}
                      Revert to this revision
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
