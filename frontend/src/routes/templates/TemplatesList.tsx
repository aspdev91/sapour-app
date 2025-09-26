import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlusIcon, Loader2Icon, FileTextIcon, GitBranchIcon } from 'lucide-react';

// TODO: Import from api-client when template API is implemented
interface Template {
  id: string;
  name: string;
  type: string;
  status: 'draft' | 'published' | 'archived';
  revisionCount: number;
  latestRevisionNumber?: number;
  updatedAt: string;
}

export default function TemplatesList() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call when templates endpoint is implemented
      // const response = await apiClient.getTemplates();
      // setTemplates(response.templates);

      // Mock data for now
      setTemplates([
        {
          id: '1',
          name: 'First Impression Template',
          type: 'first_impression',
          status: 'published',
          revisionCount: 3,
          latestRevisionNumber: 3,
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'My Type Template',
          type: 'my_type',
          status: 'draft',
          revisionCount: 1,
          updatedAt: new Date().toISOString(),
        },
      ]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const getStatusColor = (status: Template['status']) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTemplateTypeLabel = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2Icon className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading templates...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchTemplates} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground">
            Manage template content and revisions for report generation
          </p>
        </div>
        <Button asChild>
          <Link to="/templates/new">
            <PlusIcon className="h-4 w-4 mr-2" />
            New Template
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <FileTextIcon className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                </div>
                <Badge className={getStatusColor(template.status)}>{template.status}</Badge>
              </div>
              <CardDescription>{getTemplateTypeLabel(template.type)}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <div className="flex items-center space-x-1">
                  <GitBranchIcon className="h-4 w-4" />
                  <span>
                    {template.revisionCount} revision{template.revisionCount !== 1 ? 's' : ''}
                  </span>
                </div>
                {template.latestRevisionNumber && (
                  <span className="font-medium">Rev {template.latestRevisionNumber}</span>
                )}
              </div>
              <div className="flex space-x-2">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link to={`/templates/${template.id}`}>Edit</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link to={`/templates/${template.id}/versions`}>Revisions</Link>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Updated {new Date(template.updatedAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <FileTextIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first template to get started with content management.
          </p>
          <Button asChild>
            <Link to="/templates/new">
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Template
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
